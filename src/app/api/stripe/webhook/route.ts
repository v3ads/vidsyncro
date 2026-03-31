import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent, STRIPE_PLAN_BY_PRICE } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { sendEmail, emailTemplates } from '@/lib/brevo'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(rawBody, signature)
  } catch (err) {
    console.error('Stripe webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vidsyncro.com'

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const plan = session.metadata?.plan

      if (!userId || !plan) break

      await supabaseAdmin
        .from('profiles')
        .update({
          plan,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
        })
        .eq('id', userId)

      // Send plan upgrade email
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email, name')
        .eq('id', userId)
        .single()

      if (profile?.email) {
        const tmpl = emailTemplates.planUpgraded(
          profile.name || '',
          plan,
          `${appUrl}/dashboard`
        )
        await sendEmail({ to: { email: profile.email, name: profile.name || undefined }, ...tmpl })
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const priceId = sub.items.data[0]?.price.id
      const plan = priceId ? STRIPE_PLAN_BY_PRICE[priceId] : null
      const customerId = sub.customer as string

      if (!plan) break

      await supabaseAdmin
        .from('profiles')
        .update({ plan, stripe_subscription_id: sub.id })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      // Downgrade to free
      await supabaseAdmin
        .from('profiles')
        .update({ plan: 'free', stripe_subscription_id: null })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email, name')
        .eq('stripe_customer_id', customerId)
        .single()

      if (profile?.email) {
        const tmpl = emailTemplates.paymentFailed(
          profile.name || '',
          `${appUrl}/dashboard/settings?billing=1`
        )
        await sendEmail({ to: { email: profile.email, name: profile.name || undefined }, ...tmpl })
      }
      break
    }

    default:
      // Unhandled event type
      break
  }

  return NextResponse.json({ received: true })
}
