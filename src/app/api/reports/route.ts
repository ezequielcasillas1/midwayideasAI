import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface CreateReportRequest {
  targetType: 'listing' | 'user' | 'comment'
  targetId: string
  reason: string
  description?: string
}

async function getUserFromRequest(request: NextRequest): Promise<{ id: string } | null> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.substring(7)
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  
  if (error || !user) {
    return null
  }

  return { id: user.id }
}

async function isAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single()

  return !error && data?.is_admin === true
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

    const body: CreateReportRequest = await request.json()

    if (!body.targetType || !['listing', 'user', 'comment'].includes(body.targetType)) {
      return NextResponse.json(
        { error: 'Invalid target type' },
        { status: 400 }
      )
    }

    if (!body.targetId || typeof body.targetId !== 'string') {
      return NextResponse.json(
        { error: 'Missing target ID' },
        { status: 400 }
      )
    }

    if (!body.reason || typeof body.reason !== 'string' || body.reason.length < 5) {
      return NextResponse.json(
        { error: 'Reason is required (min 5 characters)' },
        { status: 400 }
      )
    }

    const { data: existingReport } = await supabaseAdmin
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('target_type', body.targetType)
      .eq('target_id', body.targetId)
      .eq('status', 'pending')
      .single()

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this item' },
        { status: 409 }
      )
    }

    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .insert({
        reporter_id: user.id,
        target_type: body.targetType,
        target_id: body.targetId,
        reason: body.reason,
        description: body.description || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating report:', error)
      return NextResponse.json(
        { error: 'Failed to create report' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      report: {
        id: report.id,
        status: report.status,
        createdAt: report.created_at,
      },
    })
  } catch (error) {
    console.error('Report creation error:', error)
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

    const admin = await isAdmin(user.id)
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const targetType = searchParams.get('targetType')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    let query = supabaseAdmin
      .from('reports')
      .select(`
        *,
        reporter:users!reporter_id(id, email, display_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (!admin) {
      query = query.eq('reporter_id', user.id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (targetType) {
      query = query.eq('target_type', targetType)
    }

    const { data: reports, error, count } = await query

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      reports,
      total: count,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Reports fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const admin = await isAdmin(user.id)
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { reportId, status, resolutionNotes } = body

    if (!reportId) {
      return NextResponse.json(
        { error: 'Report ID required' },
        { status: 400 }
      )
    }

    if (!status || !['pending', 'reviewing', 'resolved', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const { data: report, error } = await supabaseAdmin
      .from('reports')
      .update({
        status,
        resolution_notes: resolutionNotes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .select()
      .single()

    if (error) {
      console.error('Error updating report:', error)
      return NextResponse.json(
        { error: 'Failed to update report' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error('Report update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
