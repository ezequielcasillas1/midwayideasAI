import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ).auth.getUser(request.headers.get('authorization')?.replace('Bearer ', ''))

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { transactionId } = await request.json()

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
    }

    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('*, escrow_holds(*)')
      .eq('id', transactionId)
      .single()

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (transaction.buyer_id !== user.id) {
      return NextResponse.json({ 
        error: 'Only the buyer can confirm delivery' 
      }, { status: 403 })
    }

    if (transaction.status !== 'processing') {
      return NextResponse.json({ 
        error: `Cannot release escrow for transaction with status: ${transaction.status}` 
      }, { status: 400 })
    }

    const { data: sellerAccount } = await supabaseAdmin
      .from('connected_accounts')
      .select('stripe_account_id')
      .eq('user_id', transaction.seller_id)
      .single()

    if (!sellerAccount) {
      return NextResponse.json({ error: 'Seller account not found' }, { status: 400 })
    }

    await supabaseAdmin
      .from('transactions')
      .update({
        buyer_confirmed_at: new Date().toISOString(),
        status: 'completed',
        escrow_released_at: new Date().toISOString(),
      })
      .eq('id', transactionId)

    await supabaseAdmin
      .from('escrow_holds')
      .update({
        status: 'released',
        release_requested_at: new Date().toISOString(),
        released_at: new Date().toISOString(),
      })
      .eq('transaction_id', transactionId)

    await supabaseAdmin
      .from('listings')
      .update({ status: 'sold' })
      .eq('id', transaction.listing_id)

    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('title')
      .eq('id', transaction.listing_id)
      .single()

    await supabaseAdmin.from('notifications').insert({
      user_id: transaction.seller_id,
      type: 'transaction_complete',
      title: 'Sale Completed',
      message: `The buyer has confirmed delivery for "${listing?.title}". Funds will be available in your account shortly.`,
      data: { transaction_id: transactionId },
    })

    await supabaseAdmin.from('notifications').insert({
      user_id: transaction.buyer_id,
      type: 'transaction_complete',
      title: 'Purchase Complete',
      message: `Your purchase of "${listing?.title}" is complete. Thank you!`,
      data: { transaction_id: transactionId },
    })

    return NextResponse.json({
      success: true,
      message: 'Escrow released successfully',
    })
  } catch (error) {
    console.error('Escrow release error:', error)
    return NextResponse.json(
      { error: 'Failed to release escrow' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('transactionId')

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
    }

    const { data: { user }, error: authError } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ).auth.getUser(request.headers.get('authorization')?.replace('Bearer ', ''))

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: escrow } = await supabaseAdmin
      .from('escrow_holds')
      .select('*')
      .eq('transaction_id', transactionId)
      .single()

    if (!escrow) {
      return NextResponse.json({ error: 'Escrow not found' }, { status: 404 })
    }

    return NextResponse.json({ escrow })
  } catch (error) {
    console.error('Get escrow error:', error)
    return NextResponse.json(
      { error: 'Failed to get escrow status' },
      { status: 500 }
    )
  }
}
