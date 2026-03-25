import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getUserFromRequest(request: NextRequest): Promise<{ id: string; email: string } | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  
  if (error || !user || !user.email) {
    return null
  }

  return { id: user.id, email: user.email }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id_verified')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'Failed to check verification status' },
        { status: 500 }
      )
    }

    if (userData?.id_verified) {
      return NextResponse.json({
        verified: true,
        message: 'Identity already verified',
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        user_id: user.id,
      },
      options: {
        document: {
          require_matching_selfie: true,
        },
      },
      return_url: `${appUrl}/settings/verification?session_id={VERIFICATION_SESSION_ID}`,
    })

    return NextResponse.json({
      sessionId: verificationSession.id,
      url: verificationSession.url,
      status: verificationSession.status,
    })
  } catch (error) {
    console.error('Identity verification error:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      const { data: userData, error } = await supabaseAdmin
        .from('users')
        .select('id_verified')
        .eq('id', user.id)
        .single()

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch verification status' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        verified: userData?.id_verified || false,
      })
    }

    const session = await stripe.identity.verificationSessions.retrieve(sessionId)

    if (session.metadata?.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (session.status === 'verified') {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ id_verified: true })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating user verification status:', updateError)
      }
    }

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      verified: session.status === 'verified',
      lastError: session.last_error,
    })
  } catch (error) {
    console.error('Identity status check error:', error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
