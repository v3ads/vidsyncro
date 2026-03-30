import { motion } from "framer-motion"
import Link from "next/link"
import type { Project } from "@/types"

interface ProjectCardProps {
  project: Project
  onDelete?: (id: string) => Promise<void>
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const statusColor =
    project.status === "published"
      ? "bg-green-500/20 text-green-400"
      : project.status === "archived"
      ? "bg-gray-500/20 text-gray-400"
      : "bg-yellow-500/20 text-yellow-400"

  const thumbnail = project.videoA?.thumbnailUrl ?? project.videoB?.thumbnailUrl ?? null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300"
    >
      <div className="aspect-video bg-gradient-to-br from-purple-900/40 to-blue-900/40 flex items-center justify-center">
        {thumbnail ? (
          <img src={thumbnail} alt={project.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-white/20 text-4xl">▶</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-white truncate">{project.title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusColor}`}>{project.status}</span>
        </div>
        {project.description && (
          <p className="text-sm text-white/50 line-clamp-2 mb-3">{project.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/30">{new Date(project.createdAt).toLocaleDateString()}</span>
          <div className="flex gap-3">
            <Link href={`/dashboard/projects/${project.id}/editor`} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
              Edit →
            </Link>
            {onDelete && (
              <button onClick={() => onDelete(project.id)} className="text-xs text-red-400 hover:text-red-300 transition-colors">
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
