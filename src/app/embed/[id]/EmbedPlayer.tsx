'use client'

import VidSyncroPlayer from '@/components/player/VidSyncroPlayer'
import type { Project } from '@/types'

export default function EmbedPlayer({ project }: { project: Project }) {
  return (
    <div style={{ width: '100vw', height: '100vh', background: project.embedConfig.backgroundColor || '#000' }}>
      <VidSyncroPlayer project={project} />
    </div>
  )
}
