import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface FingerprintCheckRequest {
  fingerprint: {
    hash: string
    canvas: string
    webgl: string
    screen: string
    platform: string
  }
}

interface StoredFingerprint {
  hash: string
  canvas: string
  webgl: string
  screen: string
  platform: string
  collected_at: string
}

function compareFingerprints(
  fp1: FingerprintCheckRequest['fingerprint'],
  fp2: StoredFingerprint
): number {
  let matchScore = 0
  let totalChecks = 0

  const checks = [
    { match: fp1.hash === fp2.hash, weight: 5 },
    { match: fp1.canvas === fp2.canvas, weight: 3 },
    { match: fp1.webgl === fp2.webgl, weight: 3 },
    { match: fp1.screen === fp2.screen, weight: 2 },
    { match: fp1.platform === fp2.platform, weight: 2 },
  ]

  for (const check of checks) {
    totalChecks += check.weight
    if (check.match) {
      matchScore += check.weight
    }
  }

  return matchScore / totalChecks
}

export async function POST(request: NextRequest) {
  try {
    const body: FingerprintCheckRequest = await request.json()

    if (!body.fingerprint || !body.fingerprint.hash) {
      return NextResponse.json(
        { error: 'Invalid fingerprint data' },
        { status: 400 }
      )
    }

    const { data: bans, error: bansError } = await supabaseAdmin
      .from('user_bans')
      .select('id, user_id, device_fingerprints, reason, created_at')
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)

    if (bansError) {
      console.error('Error fetching bans:', bansError)
      return NextResponse.json(
        { error: 'Failed to check fingerprint' },
        { status: 500 }
      )
    }

    let isBanned = false
    let matchedBan: { userId: string; reason: string; similarity: number } | null = null

    for (const ban of bans || []) {
      const storedFingerprints = (ban.device_fingerprints || []) as StoredFingerprint[]
      
      for (const storedFp of storedFingerprints) {
        const similarity = compareFingerprints(body.fingerprint, storedFp)
        
        if (similarity >= 0.85) {
          isBanned = true
          matchedBan = {
            userId: ban.user_id,
            reason: ban.reason,
            similarity,
          }
          break
        }
      }
      
      if (isBanned) break
    }

    if (isBanned && matchedBan) {
      return NextResponse.json({
        blocked: true,
        reason: 'Device associated with banned account',
      })
    }

    return NextResponse.json({
      blocked: false,
    })
  } catch (error) {
    console.error('Fingerprint check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    const body: FingerprintCheckRequest = await request.json()

    if (!body.fingerprint || !body.fingerprint.hash) {
      return NextResponse.json(
        { error: 'Invalid fingerprint data' },
        { status: 400 }
      )
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('device_fingerprints')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'Failed to update fingerprint' },
        { status: 500 }
      )
    }

    const existingFingerprints = (userData?.device_fingerprints || []) as StoredFingerprint[]
    
    const alreadyExists = existingFingerprints.some(
      fp => fp.hash === body.fingerprint.hash
    )

    if (!alreadyExists) {
      const newFingerprint: StoredFingerprint = {
        ...body.fingerprint,
        collected_at: new Date().toISOString(),
      }

      const updatedFingerprints = [...existingFingerprints, newFingerprint].slice(-5)

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ device_fingerprints: updatedFingerprints })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating fingerprints:', updateError)
        return NextResponse.json(
          { error: 'Failed to save fingerprint' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      stored: !alreadyExists,
    })
  } catch (error) {
    console.error('Fingerprint store error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
