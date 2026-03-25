import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { spendPoints } from '@/features/membership/services/points-service'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('sb-access-token')?.value

    if (!token) {
      const { data: { session } } = await createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      ).auth.getSession()
      
      if (!session?.user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
      }
      
      const { amount, reason } = await request.json()
      
      if (!amount || amount <= 0) {
        return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
      }
      
      if (!reason) {
        return NextResponse.json({ success: false, error: 'Reason required' }, { status: 400 })
      }

      const result = await spendPoints(session.user.id, amount, reason)
      
      return NextResponse.json({
        success: result.success,
        newBalance: result.newBalance,
        error: result.error,
      })
    }

    const { data: { user }, error: authError } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ).auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })
    }

    const { amount, reason } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 })
    }

    if (!reason) {
      return NextResponse.json({ success: false, error: 'Reason required' }, { status: 400 })
    }

    const result = await spendPoints(user.id, amount, reason)

    return NextResponse.json({
      success: result.success,
      newBalance: result.newBalance,
      error: result.error,
    })
  } catch (error) {
    console.error('Spend points error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
