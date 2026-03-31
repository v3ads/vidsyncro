'use client'

import { useEffect, useRef, useState } from 'react'
import VidSyncroPlayer from '@/components/player/VidSyncroPlayer'
import type { Project } from '@/types'

interface Props {
  params: { slug: string }
}

export default function SlugPage({ params }: Props) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null)

  useEffect(() => {
    fetch(`/api/projects/slug/${params.slug}`)
      .then(r => {
        if (r.status === 404) { setNotFoundState(true); setLoading(false); return null }
        return r.json()
      })
      .then(data => {
        if (data) setProject(data)
        setLoading(false)
      })
      .catch(() => { setNotFoundState(true); setLoading(false) })
  }, [params.slug])

  // Responsive aspect-ratio fitting — same logic as EmbedPlayer
  useEffect(() => {
    if (!project) return

    const raw = project.videoA?.aspectRatio || project.videoB?.aspectRatio || '16:9'
    const [w, h] = raw.split(':').map(Number)
    const aspectRatio = (w && h) ? w / h : 16 / 9

    const measure = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      let width = vw
      let height = vw / aspectRatio
      if (height > vh) {
        height = vh
        width = vh * aspectRatio
      }
      setDims({ width: Math.floor(width), height: Math.floor(height) })
    }

    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    screen.orientation?.addEventListener('change', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
      screen.orientation?.removeEventListener('change', measure)
    }
  }, [project])

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '2px solid rgba(139,92,246,0.3)',
          borderTopColor: '#8b5cf6',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (notFoundState || !project) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#000',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontFamily: 'system-ui, sans-serif'
      }}>
        <div style={{ fontSize: 64, fontWeight: 700, color: '#8b5cf6' }}>404</div>
        <div style={{ fontSize: 18, color: '#aaa', marginTop: 8 }}>Project not found</div>
        <a href="https://www.vidsyncro.com" style={{ marginTop: 24, color: '#8b5cf6', textDecoration: 'none' }}>
          ← Back to VidSyncro
        </a>
      </div>
    )
  }

  const bg = project.embedConfig?.backgroundColor || '#000'

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', touchAction: 'none'
    }}>
      {dims ? (
        <div style={{ width: dims.width, height: dims.height, position: 'relative', flexShrink: 0 }}>
          <VidSyncroPlayer project={project} />
        </div>
      ) : (
        <div style={{
          width: '100%', aspectRatio: '16/9', background: '#111',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '2px solid rgba(139,92,246,0.3)',
            borderTopColor: '#8b5cf6',
            animation: 'spin 0.8s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}
    </div>
  )
}
