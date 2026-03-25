import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { calculatePointsForDollars, POINTS_MAX_PURCHASE_DOLLARS } from '@/lib/membership-config'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { dollars } = await request.json() as { dollars: number }

    if (!dollars || dollars < 1 || dollars > POINTS_MAX_PURCHASE_DOLLARS) {
      return NextResponse.json(
        { error: `Amount must be between $1 and $${POINTS_MAX_PURCHASE_DOLLARS}` },
        { status: 400 }
      )
    }

    const amount = Math.floor(dollars)
    const points = calculatePointsForDollars(amount)

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let customerId: string

    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      await supabaseAdmin.from('subscriptions').upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        status: 'inactive',
        tier: 'citizen',
      }, {
        onConflict: 'user_id',
      })
    }

    const priceInCents = amount * 100

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${points} Points`,
              description: `Purchase ${points} points for $${amount}`,
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?points=success&amount=${points}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?points=canceled`,
      metadata: {
        user_id: user.id,
        type: 'points_purchase',
        dollars_spent: amount.toString(),
        points_amount: points.toString(),
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    console.error('Points checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
