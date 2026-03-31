import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { analyzeSwitchPoints } from '@/lib/mux-ai'

export async function POST(req: NextRequest) {
  const session = await getServerSession()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await req.json()
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const { data: project } = await supabaseAdmin
    .from('projects')
    .select('user_id, video_a, video_b')
    .eq('id', projectId)
    .single()

  if (!project || project.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const videoA = project.video_a as { muxAssetId?: string } | null
  const videoB = project.video_b as { muxAssetId?: string } | null

  if (!videoA?.muxAssetId || !videoB?.muxAssetId) {
    return NextResponse.json({ error: 'Both videos must be ready' }, { status: 400 })
  }

  const result = await analyzeSwitchPoints(videoA.muxAssetId, videoB.muxAssetId)
  return NextResponse.json(result)
}
