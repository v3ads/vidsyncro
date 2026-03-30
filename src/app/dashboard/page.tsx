'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { formatNumber, timeAgo } from '@/lib/utils'
import type { Project } from '@/types'
import { ProjectCard } from '@/components/dashboard/ProjectCard'

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const totalViews = projects.reduce((sum, p) => sum + p.totalViews, 0)
  const totalInteractions = projects.reduce((sum, p) => sum + p.totalInteractions, 0)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects')
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this project? This cannot be undone.')) return
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error('Failed to delete project:', err)
    }
  }

  const stats = [
    {
      label: 'Total Projects',
      value: projects.length,
      icon: '🎬',
      color: 'from-violet-600/20 to-violet-600/5',
    },
    {
      label: 'Total Views',
      value: formatNumber(totalViews),
      icon: '👁',
      color: 'from-cyan-600/20 to-cyan-600/5',
    },
    {
      label: 'Interactions',
      value: formatNumber(totalInteractions),
      icon: '✋',
      color: 'from-pink-600/20 to-pink-600/5',
    },
  ]

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-heading text-3xl font-bold">
          Welcome back, {session?.user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-zinc-400 mt-1">Here's what's happening with your projects.</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            className={`rounded-2xl p-6 bg-gradient-to-br ${stat.color} border border-white/5`}
          >
            <div className="text-2xl mb-3">{stat.icon}</div>
            <div className="font-heading text-3xl font-bold">{stat.value}</div>
            <div className="text-zinc-400 text-sm mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Projects */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-xl font-bold">Your Projects</h2>
        <Link
          href="/dashboard/projects/new"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-[#111111] border border-white/5 aspect-[16/10] animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 rounded-2xl border border-dashed border-white/10"
        >
          <div className="text-5xl mb-4">🎬</div>
          <h3 className="font-heading text-xl font-bold mb-2">No projects yet</h3>
          <p className="text-zinc-400 text-sm mb-6 text-center max-w-sm">
            Create your first dual-video project and start showing two realities to your audience.
          </p>
          <Link
            href="/dashboard/projects/new"
            className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
          >
            Create First Project →
          </Link>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {projects.map((project) => (
            <motion.div key={project.id} variants={fadeUp}>
              <ProjectCard project={project} onDelete={handleDelete} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
