import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { generateSlug, generateEmbedId } from '@/lib/utils'
import type { OverlayConfig, EmbedConfig } from '@/types'

const DEFAULT_OVERLAY: OverlayConfig = {
  switchMode: 'hold',
  transitionType: 'crossfade',
  transitionDuration: 150,
  showHint: true,
  hintText: 'Hold to reveal',
  hintPosition: 'bottom-center',
  showSwitchIndicator: true,
  indicatorColor: '#8b5cf6',
  brandingVisible: true,
  brandingText: 'Powered by VidSyncro',
  brandingUrl: 'https://vidsyncro.com',
  autoSwitchEnabled: false,
  autoSwitchInterval: 5,
}

const DEFAULT_EMBED: EmbedConfig = {
  width: '100%',
  height: '100%',
  responsive: true,
  autoplay: false,
  muted: false,
  loop: false,
  allowFullscreen: true,
  shareEnabled: true,
  passwordProtected: false,
  password: null,
  domainWhitelist: [],
  primaryColor: '#8b5cf6',
  backgroundColor: '#000000',
}

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { title, description } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const baseSlug = generateSlug(title)
  const slug = `${baseSlug}-${generateEmbedId()}`

  const { data, error } = await supabaseAdmin
    .from('projects')
    .insert({
      user_id: session.user.id,
      title: title.trim(),
      slug,
      description: description?.trim() || null,
      video_a: null,
      video_b: null,
      overlay_config: DEFAULT_OVERLAY,
      embed_config: DEFAULT_EMBED,
      status: 'draft',
      total_views: 0,
      total_interactions: 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
