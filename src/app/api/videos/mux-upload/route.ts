import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { createUploadUrl } from '@/lib/mux'
import { supabaseAdmin } from '@/lib/supabase'

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
