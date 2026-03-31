'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { Project } from '@/types'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((raw) => {
        const mapped = (Array.isArray(raw) ? raw : []).map((d: Record<string, unknown>) => ({
          id: d.id,
          userId: d.user_id,
          title: d.title,
          slug: d.slug,
          description: d.description ?? null,
          videoA: d.video_a ?? null,
          videoB: d.video_b ?? null,
          overlayConfig: d.overlay_config,
          embedConfig: d.embed_config,
          status: d.status,
          totalViews: d.total_views ?? 0,
          totalInteractions: d.total_interactions ?? 0,
          createdAt: d.created_at as string,
          updatedAt: d.updated_at as string,
        }))
        setProjects(mapped as unknown as Project[])
      })
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }, [])

  const totalViews = projects.reduce((s, p) => s + (p.totalViews || 0), 0)
  const totalInteractions = projects.reduce((s, p) => s + (p.totalInteractions || 0), 0)
  const published = projects.filter((p) => p.status === 'published').length

  const stats = [
    { label: 'Total Views', value: totalViews.toLocaleString(), icon: '👁️' },
    { label: 'Interactions', value: totalInteractions.toLocaleString(), icon: '🖱️' },
    { label: 'Published Projects', value: published, icon: '🚀' },
    { label: 'Total Projects', value: projects.length, icon: '🎬' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
        <h1 className="text-2xl font-bold text-white">Analytics</h1>
        <p className="text-zinc-500 text-sm mt-1">Performance overview across all your projects.</p>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial="hidden"
            animate="visible"
            custom={i + 1}
            variants={fadeUp}
            className="bg-[#111111] border border-white/10 rounded-2xl p-5"
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold text-white">{loading ? '—' : stat.value}</div>
            <div className="text-xs text-zinc-500 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Per-project table */}
      <motion.div
        initial="hidden"
        animate="visible"
        custom={5}
        variants={fadeUp}
        className="bg-[#111111] border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Projects Breakdown</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 text-zinc-600">
            <p className="text-4xl mb-3">📊</p>
            <p className="text-sm">No projects yet. Create one to see analytics.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {projects.map((project) => (
              <div key={project.id} className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{project.title}</p>
                  <p className="text-xs text-zinc-600 mt-0.5 capitalize">{project.status}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-white">{(project.totalViews || 0).toLocaleString()}</p>
                  <p className="text-xs text-zinc-600">views</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-violet-400">{(project.totalInteractions || 0).toLocaleString()}</p>
                  <p className="text-xs text-zinc-600">interactions</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
