'use client'

import { useEffect, useState } from 'react'
import { notFound } from 'next/navigation'
import VidSyncroPlayer from '@/components/player/VidSyncroPlayer'
import type { Project } from '@/types'

interface Props {
  params: { slug: string }
}

export default function SlugPage({ params }: Props) {
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFoundState, setNotFoundState] = useState(false)

  useEffect(() => {
    fetch(`/api/projects/slug/${params.slug}`)
      .then(r => {
        if (r.status === 404) { setNotFoundState(true); setLoading(false); return null; }
        return r.json();
      })
      .then(data => {
        if (data) { setProject(data); }
        setLoading(false);
      })
      .catch(() => { setNotFoundState(true); setLoading(false); });
  }, [params.slug])

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

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: project.embedConfig?.backgroundColor || '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', touchAction: 'none'
    }}>
      <VidSyncroPlayer project={project} />
    </div>
  )
}
