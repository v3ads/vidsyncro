import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { headers } from 'next/headers'
import Mux from '@mux/mux-node'

const muxClient = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const headersList = headers()
  const signature = headersList.get('mux-signature') ?? ''

  // Verify webhook signature
  if (process.env.MUX_WEBHOOK_SECRET) {
    try {
      muxClient.webhooks.verifySignature(rawBody, { 'mux-signature': signature }, process.env.MUX_WEBHOOK_SECRET)
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let event: { type: string; data: Record<string, unknown> }
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (event.type === 'video.asset.ready') {
    const asset = event.data as {
      id: string
      upload_id?: string
      playback_ids?: Array<{ id: string; policy: string }>
      duration?: number
      aspect_ratio?: string
      passthrough?: string
    }

    let projectId: string | null = null
    let videoSlot: 'a' | 'b' | null = null

    if (asset.passthrough) {
      try {
        const passthrough = JSON.parse(asset.passthrough)
        projectId = passthrough.projectId
        videoSlot = passthrough.videoSlot
      } catch {}
    }

    if (!projectId || !videoSlot) {
      console.error('Missing passthrough data in webhook')
      return NextResponse.json({ received: true })
    }

    const playbackId = asset.playback_ids?.find(p => p.policy === 'public')?.id

    if (!playbackId) {
      console.error('No public playback ID for asset', asset.id)
      return NextResponse.json({ received: true })
    }

    const videoAsset = {
      id: asset.upload_id || asset.id,
      muxAssetId: asset.id,
      muxPlaybackId: playbackId,
      muxUploadId: asset.upload_id || null,
      status: 'ready' as const,
      duration: asset.duration ? Math.round(asset.duration) : null,
      aspectRatio: asset.aspect_ratio || null,
      thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.jpg`,
    }

    const field = videoSlot === 'a' ? 'video_a' : 'video_b'
    const { error } = await supabaseAdmin
      .from('projects')
      .update({ [field]: videoAsset, updated_at: new Date().toISOString() })
      .eq('id', projectId)

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }
  }

  if (event.type === 'video.asset.errored') {
    const asset = event.data as { id: string; passthrough?: string }
    if (asset.passthrough) {
      try {
        const { projectId, videoSlot } = JSON.parse(asset.passthrough)
        const field = videoSlot === 'a' ? 'video_a' : 'video_b'
        const { data: project } = await supabaseAdmin
          .from('projects')
          .select(field)
          .eq('id', projectId)
          .single()
        if (project) {
          const currentAsset = project[field] as Record<string, unknown>
          await supabaseAdmin
            .from('projects')
            .update({ [field]: { ...currentAsset, status: 'errored' } })
            .eq('id', projectId)
        }
      } catch {}
    }
  }

  return NextResponse.json({ received: true })
}
