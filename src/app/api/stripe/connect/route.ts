import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { STRIPE_CONNECT_COUNTRY } from '@/lib/payment-config'

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

    const { data: existingAccount } = await supabaseAdmin
      .from('connected_accounts')
      .select('stripe_account_id, onboarding_complete')
      .eq('user_id', user.id)
      .single()

    let stripeAccountId = existingAccount?.stripe_account_id

    if (!stripeAccountId) {
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('email, display_name')
        .eq('id', user.id)
        .single()

      const account = await stripe.accounts.create({
        type: 'express',
        country: STRIPE_CONNECT_COUNTRY,
        email: userData?.email || user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          user_id: user.id,
        },
      })

      stripeAccountId = account.id

      await supabaseAdmin
        .from('connected_accounts')
        .insert({
          user_id: user.id,
          stripe_account_id: account.id,
          onboarding_complete: false,
          charges_enabled: false,
          payouts_enabled: false,
        })
    }

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?connect=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings?connect=complete`,
      type: 'account_onboarding',
    })

    return NextResponse.json({
      url: accountLink.url,
      accountId: stripeAccountId,
    })
  } catch (error) {
    console.error('Connect onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to create onboarding link' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ).auth.getUser(request.headers.get('authorization')?.replace('Bearer ', ''))

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: account } = await supabaseAdmin
      .from('connected_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!account) {
      return NextResponse.json({
        hasAccount: false,
        onboardingComplete: false,
        chargesEnabled: false,
        payoutsEnabled: false,
      })
    }

    const stripeAccount = await stripe.accounts.retrieve(account.stripe_account_id)

    if (
      stripeAccount.charges_enabled !== account.charges_enabled ||
      stripeAccount.payouts_enabled !== account.payouts_enabled ||
      stripeAccount.details_submitted !== account.details_submitted
    ) {
      await supabaseAdmin
        .from('connected_accounts')
        .update({
          charges_enabled: stripeAccount.charges_enabled,
          payouts_enabled: stripeAccount.payouts_enabled,
          details_submitted: stripeAccount.details_submitted,
          onboarding_complete: stripeAccount.details_submitted && stripeAccount.charges_enabled,
        })
        .eq('id', account.id)
    }

    return NextResponse.json({
      hasAccount: true,
      accountId: account.stripe_account_id,
      onboardingComplete: stripeAccount.details_submitted && stripeAccount.charges_enabled,
      chargesEnabled: stripeAccount.charges_enabled,
      payoutsEnabled: stripeAccount.payouts_enabled,
      detailsSubmitted: stripeAccount.details_submitted,
    })
  } catch (error) {
    console.error('Get connect status error:', error)
    return NextResponse.json(
      { error: 'Failed to get account status' },
      { status: 500 }
    )
  }
}
