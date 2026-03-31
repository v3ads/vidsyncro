'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadZone } from '@/components/dashboard/UploadZone'
import { generateEmbedId } from '@/lib/utils'
import { DEFAULT_OVERLAY_CONFIG, DEFAULT_EMBED_CONFIG, type SwitchMode, type TransitionType } from '@/types'
import toast from 'react-hot-toast'

const steps = [
  { id: 1, label: 'Details', desc: 'Name your project' },
  { id: 2, label: 'Reality A', desc: 'Upload first video' },
  { id: 3, label: 'Reality B', desc: 'Upload second video' },
  { id: 4, label: 'Configure', desc: 'Set up interaction' },
]

export default function NewProjectPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [creating, setCreating] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [uploadIdA, setUploadIdA] = useState<string | null>(null)
  const [uploadIdB, setUploadIdB] = useState<string | null>(null)
  const [switchMode, setSwitchMode] = useState<SwitchMode>('hold')
  const [transitionType, setTransitionType] = useState<TransitionType>('crossfade')
  const [hintText, setHintText] = useState('Hold to reveal')
  const [publish, setPublish] = useState(false)

  async function createProject() {
    if (!projectId) return
    setCreating(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overlay_config: {
            ...DEFAULT_OVERLAY_CONFIG,
            switchMode,
            transitionType,
            hintText,
          },
          embed_config: DEFAULT_EMBED_CONFIG,
          status: publish ? 'published' : 'draft',
        }),
      })

      if (!res.ok) throw new Error('Failed to update project')

      toast.success('Project created!')
      router.push(`/dashboard/projects/${projectId}/editor`)
    } catch (err) {
      toast.error('Failed to create project')
      setCreating(false)
    }
  }

  async function handleContinue() {
    if (currentStep === 1) {
      // Create the draft project now so we have a projectId for uploads
      if (!projectId) {
        try {
          const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description: description || null }),
          })
          if (!res.ok) { toast.error('Failed to create project'); return }
          const proj = await res.json()
          setProjectId(proj.id)
        } catch {
          toast.error('Failed to create project')
          return
        }
      }
    }
    setCurrentStep((s) => s + 1)
  }

  const canProceed = () => {
    if (currentStep === 1) return title.trim().length >= 2
    if (currentStep === 2) return !!uploadIdA
    if (currentStep === 3) return !!uploadIdB
    return true
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-bold">New Project</h1>
        <p className="text-zinc-400 text-sm mt-1">Create a dual-video experience</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${
                  currentStep > step.id
                    ? 'bg-violet-600 text-white'
                    : currentStep === step.id
                    ? 'bg-violet-600 text-white ring-2 ring-violet-400 ring-offset-2 ring-offset-[#0a0a0a]'
                    : 'bg-white/5 text-zinc-500'
                }`}
              >
                {currentStep > step.id ? '✓' : step.id}
              </div>
              <div className="hidden sm:block">
                <p
                  className={`text-xs font-semibold ${
                    currentStep >= step.id ? 'text-white' : 'text-zinc-500'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-zinc-600">{step.desc}</p>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`h-px flex-1 mx-2 transition-all ${
                  currentStep > step.id ? 'bg-violet-600' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="glass rounded-2xl p-8">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-heading text-xl font-bold mb-1">Project Details</h2>
              <p className="text-zinc-400 text-sm mb-6">Give your dual-video experience a name.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Project Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Before & After Renovation"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Description <span className="text-zinc-600">(optional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what your audience will experience..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-heading text-xl font-bold mb-1">Upload Reality A</h2>
              <p className="text-zinc-400 text-sm mb-6">
                This is the <strong className="text-white">default</strong> video — what viewers see first.
              </p>
              <UploadZone
                label="Reality A"
                projectId={projectId ?? undefined}
                videoSlot="a"
                onComplete={(uploadId) => setUploadIdA(uploadId)}
                onUploadError={(err) => toast.error(err)}
                uploadedId={uploadIdA}
              />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-heading text-xl font-bold mb-1">Upload Reality B</h2>
              <p className="text-zinc-400 text-sm mb-6">
                This is the <strong className="text-white">reveal</strong> video — what viewers see when they hold.
              </p>
              <UploadZone
                label="Reality B"
                projectId={projectId ?? undefined}
                videoSlot="b"
                onComplete={(uploadId) => setUploadIdB(uploadId)}
                onUploadError={(err) => toast.error(err)}
                uploadedId={uploadIdB}
              />
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-heading text-xl font-bold mb-1">Configure Experience</h2>
              <p className="text-zinc-400 text-sm mb-6">Set up how viewers interact with your dual-video.</p>

              <div className="space-y-6">
                {/* Switch mode */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Interaction Mode
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['hold', 'toggle', 'hover'] as SwitchMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSwitchMode(mode)}
                        className={`py-3 rounded-xl text-sm font-semibold capitalize transition-all border ${
                          switchMode === mode
                            ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transition */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Transition Style
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(['crossfade', 'slide-left', 'slide-right', 'zoom', 'blur-reveal'] as TransitionType[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTransitionType(t)}
                        className={`py-3 rounded-xl text-sm font-semibold capitalize transition-all border ${
                          transitionType === t
                            ? 'bg-violet-600/20 border-violet-500/50 text-violet-300'
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {t.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hint text */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                    Hint Text
                  </label>
                  <input
                    type="text"
                    value={hintText}
                    onChange={(e) => setHintText(e.target.value)}
                    placeholder="Hold to reveal"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>

                {/* Publish toggle */}
                <div className="flex items-center justify-between py-4 px-5 rounded-xl bg-white/3 border border-white/5">
                  <div>
                    <p className="font-medium text-sm">Publish immediately</p>
                    <p className="text-zinc-500 text-xs mt-0.5">Make the embed publicly accessible</p>
                  </div>
                  <button
                    onClick={() => setPublish(!publish)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      publish ? 'bg-violet-600' : 'bg-white/10'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        publish ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/5">
          <button
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={currentStep === 1}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Back
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleContinue}
              disabled={!canProceed()}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={createProject}
              disabled={creating}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {creating && (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {creating ? 'Creating...' : 'Create Project →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
