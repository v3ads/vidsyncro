import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { createUploadUrl } from '@/lib/mux'
import { supabaseAdmin } from '@/lib/supabase'
import muxClient from '@/lib/mux'

// GET /api/videos/mux-upload?assetId=<uploadId>
// Polls Mux upload status and returns playbackId once ready
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const uploadId = searchParams.get('assetId')
  if (!uploadId) return NextResponse.json({ error: 'assetId required' }, { status: 400 })

  try {
    // Retrieve the upload to find the linked asset ID
    const upload = await muxClient.video.uploads.retrieve(uploadId)
    if (upload.status === 'errored') {
      return NextResponse.json({ status: 'errored' })
    }
    if (!upload.asset_id) {
      // Asset not yet created — still uploading or waiting
      return NextResponse.json({ status: 'preparing' })
    }
    // Retrieve the asset
    const asset = await muxClient.video.assets.retrieve(upload.asset_id)
    if (asset.status === 'ready') {
      const playbackId = asset.playback_ids?.find(p => p.policy === 'public')?.id
      if (playbackId) {
        return NextResponse.json({
          status: 'ready',
          playbackId,
          assetId: asset.id,
          duration: asset.duration ? Math.round(asset.duration) : null,
          aspectRatio: asset.aspect_ratio || null,
          thumbnailUrl: `https://image.mux.com/${playbackId}/thumbnail.jpg`,
        })
      }
    }
    return NextResponse.json({ status: asset.status || 'preparing' })
  } catch (err) {
    console.error('Mux status check error:', err)
    return NextResponse.json({ status: 'preparing' })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, videoSlot } = await req.json()
  if (!projectId || !['a', 'b'].includes(videoSlot)) {
    return NextResponse.json({ error: 'projectId and videoSlot (a|b) required' }, { status: 400 })
  }

  // Verify project ownership
  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('user_id')
    .eq('id', projectId)
    .single()

  if (!project || project.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const { uploadUrl, uploadId } = await createUploadUrl(projectId, videoSlot as 'a' | 'b')

    // Pre-create the video asset record with pending status
    const videoAsset = {
      id: uploadId,
      muxAssetId: null,
      muxPlaybackId: null,
      muxUploadId: uploadId,
      status: 'pending' as const,
      duration: null,
      aspectRatio: null,
      thumbnailUrl: null,
    }

    // Store in project
    const field = videoSlot === 'a' ? 'video_a' : 'video_b'
    await supabaseAdmin
      .from('projects')
      .update({ [field]: videoAsset, updated_at: new Date().toISOString() })
      .eq('id', projectId)

    return NextResponse.json({ uploadUrl, uploadId })
  } catch (err) {
    console.error('Mux upload error:', err)
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 })
  }
}
