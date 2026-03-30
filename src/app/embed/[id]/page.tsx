import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import type { Project } from '@/types'
import EmbedPlayer from './EmbedPlayer'

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabaseAdmin
    .from('projects')
    .select('title, description')
    .or(`id.eq.${params.id},slug.eq.${params.id}`)
    .eq('status', 'published')
    .single()

  return {
    title: data?.title || 'VidSyncro Player',
    description: data?.description || 'Interactive dual-video experience',
  }
}

export default async function EmbedPage({ params }: Props) {
  const { data: raw } = await supabaseAdmin
    .from('projects')
    .select('*')
    .or(`id.eq.${params.id},slug.eq.${params.id}`)
    .eq('status', 'published')
    .single()

  if (!raw) notFound()

  // Map snake_case DB fields to camelCase Project type
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
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: 'transparent', overflow: 'hidden' }}>
        <EmbedPlayer project={project} />
      </body>
    </html>
  )
}
