'use client'

import VidSyncroPlayer from '@/components/player/VidSyncroPlayer'
import type { Project } from '@/types'

// No measurement delay — render immediately at full size using CSS.
// This gets videos loading as fast as possible.
export default function EmbedPlayer({ project }: { project: Project }) {
  const aspectRatio = (() => {
    const raw = project.videoA?.aspectRatio || project.videoB?.aspectRatio || '16:9'
    const [w, h] = raw.split(':').map(Number)
    return (w && h) ? w / h : 16 / 9
  })()

  const bg = project.embedConfig.backgroundColor || '#000'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* 
        Use CSS aspect-ratio + max constraints to fit the video
        without any JS measurement. The browser handles it natively.
      */}
      <div
        style={{
          width: '100%',
          height: '100%',
          maxWidth: `calc(100vh * ${aspectRatio})`,
          maxHeight: `calc(100vw / ${aspectRatio})`,
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <VidSyncroPlayer project={project} />
      </div>
    </div>
  )
}
