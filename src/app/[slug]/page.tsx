import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import type { Project } from '@/types'
import EmbedPlayer from '@/app/embed/[id]/EmbedPlayer'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data } = await supabaseAdmin
    .from('projects')
    .select('title, description')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  return {
    title: data?.title ? `${data.title} — VidSyncro` : 'VidSyncro',
    description: data?.description || 'Interactive dual-video experience',
  }
}

export default async function SlugPage({ params }: Props) {
  const { data: raw } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (!raw) notFound()

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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#000000" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: ${raw.embed_config?.backgroundColor || '#000'};
            -webkit-tap-highlight-color: transparent;
            touch-action: none;
          }
          #embed-root {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        `}</style>
      </head>
      <body>
        <div id="embed-root">
          <EmbedPlayer project={project} />
        </div>
      </body>
    </html>
  )
}
