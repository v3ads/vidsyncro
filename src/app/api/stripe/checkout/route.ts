import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { createCheckoutSession, getOrCreateCustomer } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan } = await req.json()
  if (!['starter', 'pro', 'enterprise'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  try {
    // Get or create Stripe customer
    const customerId = await getOrCreateCustomer(session.user.id, session.user.email)

    // Store customerId in profile if not set
    await supabaseAdmin
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', session.user.id)

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vidsyncro.com'
    const returnUrl = `${appUrl}/dashboard/settings?billing=1`

    const checkoutUrl = await createCheckoutSession(
      session.user.id,
      session.user.email,
      plan as 'starter' | 'pro' | 'enterprise',
      returnUrl
    )

    return NextResponse.json({ url: checkoutUrl })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
