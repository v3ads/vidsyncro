import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { createPortalSession } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', session.user.id)
    .single()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vidsyncro.com'
  const portalUrl = await createPortalSession(
    profile.stripe_customer_id,
    `${appUrl}/dashboard/settings`
  )

  return NextResponse.json({ url: portalUrl })
}
