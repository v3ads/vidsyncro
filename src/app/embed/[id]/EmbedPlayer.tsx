'use client'

import { useEffect, useRef, useState } from 'react'
import VidSyncroPlayer from '@/components/player/VidSyncroPlayer'
import type { Project } from '@/types'

/**
 * Responsive embed wrapper.
 *
 * Strategy: measure the available space and compute the largest box
 * that fits the video's aspect ratio — portrait, landscape, and square all work.
 * This works correctly whether the parent iframe is:
 *   - 16:9 on desktop
 *   - Full-screen on a phone in portrait
 *   - Rotated to landscape
 *   - Embedded in a fixed-height container
 */
export default function EmbedPlayer({ project }: { project: Project }) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null)

  // Parse the video's aspect ratio (e.g. "16:9" → 16/9)
  const aspectRatio = (() => {
    const raw = project.videoA?.aspectRatio || project.videoB?.aspectRatio || '16:9'
    const [w, h] = raw.split(':').map(Number)
    return (w && h) ? w / h : 16 / 9
  })()

  useEffect(() => {
    const measure = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight

      // Fit the video inside the viewport maintaining aspect ratio
      let width = vw
      let height = vw / aspectRatio

      if (height > vh) {
        height = vh
        width = vh * aspectRatio
      }

      setDims({ width: Math.floor(width), height: Math.floor(height) })
    }

    measure()

    // Re-measure on resize and orientation change
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    // Also handle screen.orientation API on modern devices
    screen.orientation?.addEventListener('change', measure)

    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
      screen.orientation?.removeEventListener('change', measure)
    }
  }, [aspectRatio])

  const bg = project.embedConfig.backgroundColor || '#000'

  return (
    <div
      ref={wrapperRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        // Prevent rubber-band scroll on iOS
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
      }}
    >
      {dims ? (
        <div
          style={{
            width: dims.width,
            height: dims.height,
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <VidSyncroPlayer project={project} />
        </div>
      ) : (
        // Pre-measure skeleton — shows instantly, replaced once JS runs
        <div
          style={{
            width: '100%',
            aspectRatio: `${aspectRatio}`,
            background: '#111',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '2px solid rgba(139,92,246,0.3)',
              borderTopColor: '#8b5cf6',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
          `}</style>
        </div>
      )}
    </div>
  )
}
