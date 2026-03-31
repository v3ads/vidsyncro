import Stripe from 'stripe'
import type { Plan } from '@/types'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
})

// Map plan names to Stripe price IDs (set these in your Stripe dashboard)
export const STRIPE_PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || '',
  pro: process.env.STRIPE_PRICE_PRO || '',
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '',
}

export const STRIPE_PLAN_BY_PRICE: Record<string, Plan> = Object.fromEntries(
  Object.entries(STRIPE_PRICE_IDS).map(([plan, priceId]) => [priceId, plan as Plan])
)

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  plan: 'starter' | 'pro' | 'enterprise',
  returnUrl: string
): Promise<string> {
  const priceId = STRIPE_PRICE_IDS[plan]
  if (!priceId) throw new Error(`No Stripe price configured for plan: ${plan}`)

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
    cancel_url: `${returnUrl}?canceled=true`,
    metadata: { userId, plan },
    subscription_data: {
      metadata: { userId, plan },
    },
  })

  return session.url!
}

export async function createPortalSession(customerId: string, returnUrl: string): Promise<string> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session.url
}

export async function getOrCreateCustomer(userId: string, email: string): Promise<string> {
  // Search for existing customer
  const existing = await stripe.customers.search({
    query: `metadata['userId']:'${userId}'`,
    limit: 1,
  })

  if (existing.data.length > 0) return existing.data[0].id

  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  })
  return customer.id
}

export function constructWebhookEvent(payload: string, signature: string): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
}
