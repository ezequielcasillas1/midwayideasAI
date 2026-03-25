import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import type { MembershipTier } from '@/types'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutComplete(session)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        await handleAccountUpdated(account)
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentSucceeded(paymentIntent)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentIntentFailed(paymentIntent)
        break
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer
        await handleTransferCreated(transfer)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const purchaseType = session.metadata?.type

  if (purchaseType === 'points_purchase') {
    await handlePointsPurchase(session)
    return
  }

  const tier = session.metadata?.tier as MembershipTier

  if (!userId || !tier) {
    console.error('Missing metadata in checkout session')
    return
  }

  const customerId = session.customer as string

  if (session.mode === 'subscription') {
    const subscriptionId = session.subscription as string

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)

    await supabaseAdmin.from('subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      tier,
      status: 'active',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    }, {
      onConflict: 'user_id',
    })
  } else {
    await supabaseAdmin.from('subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: null,
      tier,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: null,
    }, {
      onConflict: 'user_id',
    })
  }

  await supabaseAdmin
    .from('memberships')
    .update({ tier })
    .eq('user_id', userId)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!sub) {
    console.error('No subscription found for customer:', customerId)
    return
  }

  const status = mapStripeStatus(subscription.status)

  await supabaseAdmin
    .from('subscriptions')
    .update({
      status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_customer_id', customerId)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!sub) return

  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_customer_id', customerId)

  await supabaseAdmin
    .from('memberships')
    .update({ tier: 'citizen' })
    .eq('user_id', sub.user_id)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_customer_id', customerId)
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
    case 'unpaid':
      return 'canceled'
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete'
    default:
      return 'active'
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  const userId = account.metadata?.user_id

  if (!userId) {
    const { data: existingAccount } = await supabaseAdmin
      .from('connected_accounts')
      .select('user_id')
      .eq('stripe_account_id', account.id)
      .single()

    if (!existingAccount) {
      console.log('No user found for account:', account.id)
      return
    }

    await supabaseAdmin
      .from('connected_accounts')
      .update({
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        onboarding_complete: account.details_submitted && account.charges_enabled,
        business_type: account.business_type,
      })
      .eq('stripe_account_id', account.id)

    return
  }

  await supabaseAdmin
    .from('connected_accounts')
    .upsert({
      user_id: userId,
      stripe_account_id: account.id,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      onboarding_complete: account.details_submitted && account.charges_enabled,
      business_type: account.business_type,
    }, {
      onConflict: 'user_id',
    })
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const transactionId = paymentIntent.metadata?.transaction_id

  if (!transactionId) {
    console.log('No transaction_id in payment intent metadata')
    return
  }

  await supabaseAdmin
    .from('transactions')
    .update({
      status: 'processing',
      stripe_charge_id: paymentIntent.latest_charge as string,
    })
    .eq('id', transactionId)

  await supabaseAdmin
    .from('escrow_holds')
    .update({ status: 'held' })
    .eq('transaction_id', transactionId)

  const { data: transaction } = await supabaseAdmin
    .from('transactions')
    .select('seller_id, listing_id')
    .eq('id', transactionId)
    .single()

  if (transaction) {
    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('title')
      .eq('id', transaction.listing_id)
      .single()

    await supabaseAdmin.from('notifications').insert({
      user_id: transaction.seller_id,
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment received for "${listing?.title || 'your listing'}". Funds are held in escrow.`,
      data: { transaction_id: transactionId },
    })
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const transactionId = paymentIntent.metadata?.transaction_id

  if (!transactionId) return

  await supabaseAdmin
    .from('transactions')
    .update({ status: 'failed' })
    .eq('id', transactionId)
}

async function handleTransferCreated(transfer: Stripe.Transfer) {
  const transactionId = transfer.metadata?.transaction_id

  if (!transactionId) return

  await supabaseAdmin
    .from('transactions')
    .update({
      stripe_transfer_id: transfer.id,
      status: 'completed',
      escrow_released_at: new Date().toISOString(),
    })
    .eq('id', transactionId)

  await supabaseAdmin
    .from('escrow_holds')
    .update({
      status: 'released',
      released_at: new Date().toISOString(),
    })
    .eq('transaction_id', transactionId)

  const { data: transaction } = await supabaseAdmin
    .from('transactions')
    .select('seller_id, listing_id, seller_amount')
    .eq('id', transactionId)
    .single()

  if (transaction) {
    await supabaseAdmin.from('notifications').insert({
      user_id: transaction.seller_id,
      type: 'escrow_released',
      title: 'Funds Released',
      message: `$${(transaction.seller_amount / 100).toFixed(2)} has been released to your account.`,
      data: { transaction_id: transactionId },
    })
  }
}

async function handlePointsPurchase(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const pointsAmount = parseInt(session.metadata?.points_amount || '0', 10)
  const packageId = session.metadata?.package_id

  if (!userId || !pointsAmount) {
    console.error('Missing metadata in points purchase session')
    return
  }

  const { data: membership } = await supabaseAdmin
    .from('memberships')
    .select('points')
    .eq('user_id', userId)
    .single()

  const currentPoints = membership?.points || 0
  const newTotal = currentPoints + pointsAmount

  await supabaseAdmin
    .from('point_transactions')
    .insert({
      user_id: userId,
      amount: pointsAmount,
      reason: `Purchased points package: ${packageId}`,
      multiplier_applied: 1.0,
    })

  await supabaseAdmin
    .from('memberships')
    .update({ points: newTotal })
    .eq('user_id', userId)

  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type: 'points_purchased',
    title: 'Points Added',
    message: `${pointsAmount} points have been added to your account.`,
    data: { points_amount: pointsAmount, package_id: packageId },
  })
}
