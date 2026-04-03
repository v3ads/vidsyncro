import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { Project } from '@/types'

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const { data: raw, error } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (error || !raw) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const project: Project = {
    id: raw.id,
    userId: raw.user_id,
    title: raw.title,
    slug: raw.slug,
    description: raw.description,
    videoA: raw.video_a,
    videoB: raw.video_b,
    overlayConfig: raw.overlay_config,
    embedConfig: raw.embed_config,
    status: raw.status,
    totalViews: raw.total_views,
    totalInteractions: raw.total_interactions,
    clientSlug: raw.client_slug || null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }

  return NextResponse.json(project)
}
