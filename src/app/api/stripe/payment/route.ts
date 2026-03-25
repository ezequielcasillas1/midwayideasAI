import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { 
  calculatePlatformFee, 
  calculateSellerAmount, 
  CURRENCY,
  MIN_TRANSACTION_AMOUNT 
} from '@/lib/payment-config'

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

    const { listingId } = await request.json()

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID required' }, { status: 400 })
    }

    const { data: listing, error: listingError } = await supabaseAdmin
      .from('listings')
      .select('id, title, price, seller_id, status')
      .eq('id', listingId)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.status !== 'active') {
      return NextResponse.json({ error: 'Listing is not available' }, { status: 400 })
    }

    if (listing.seller_id === user.id) {
      return NextResponse.json({ error: 'Cannot purchase your own listing' }, { status: 400 })
    }

    const amountInCents = listing.price * 100

    if (amountInCents < MIN_TRANSACTION_AMOUNT) {
      return NextResponse.json({ 
        error: `Minimum transaction amount is $${MIN_TRANSACTION_AMOUNT / 100}` 
      }, { status: 400 })
    }

    const { data: sellerAccount, error: accountError } = await supabaseAdmin
      .from('connected_accounts')
      .select('stripe_account_id, charges_enabled, payouts_enabled')
      .eq('user_id', listing.seller_id)
      .single()

    if (accountError || !sellerAccount) {
      return NextResponse.json({ 
        error: 'Seller has not enabled payments' 
      }, { status: 400 })
    }

    if (!sellerAccount.charges_enabled || !sellerAccount.payouts_enabled) {
      return NextResponse.json({ 
        error: 'Seller payment account is not fully set up' 
      }, { status: 400 })
    }

    const platformFee = calculatePlatformFee(amountInCents)
    const sellerAmount = calculateSellerAmount(amountInCents)

    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.seller_id,
        amount: amountInCents,
        platform_fee: platformFee,
        seller_amount: sellerAmount,
        currency: CURRENCY,
        status: 'pending',
      })
      .select()
      .single()

    if (txError || !transaction) {
      console.error('Transaction creation error:', txError)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    await supabaseAdmin.from('escrow_holds').insert({
      transaction_id: transaction.id,
      amount: sellerAmount,
      currency: CURRENCY,
      status: 'held',
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: CURRENCY,
      automatic_payment_methods: {
        enabled: true,
      },
      application_fee_amount: platformFee,
      transfer_data: {
        destination: sellerAccount.stripe_account_id,
      },
      metadata: {
        transaction_id: transaction.id,
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: listing.seller_id,
      },
      description: `Purchase: ${listing.title}`,
    })

    await supabaseAdmin
      .from('transactions')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', transaction.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction.id,
      amount: amountInCents,
      platformFee,
      sellerAmount,
    })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment' },
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

    const { data: transaction } = await supabaseAdmin
      .from('transactions')
      .select('*, escrow_holds(*)')
      .eq('id', transactionId)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .single()

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Get transaction error:', error)
    return NextResponse.json(
      { error: 'Failed to get transaction' },
      { status: 500 }
    )
  }
}
