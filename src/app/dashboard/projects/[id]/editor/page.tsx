'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import VidSyncroPlayer from '@/components/player/VidSyncroPlayer'
import { UploadZone } from '@/components/dashboard/UploadZone'
import type { Project, OverlayConfig, EmbedConfig } from '@/types'

const TABS = ['Videos', 'Overlay', 'Embed', 'Analytics'] as const
type Tab = typeof TABS[number]

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-zinc-400 mb-1.5">{children}</label>
}
function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
    />
  )
}
function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
    >
      {children}
    </select>
  )
}
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-300">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-violet-600' : 'bg-zinc-700'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('Videos')
  const [analytics, setAnalytics] = useState<{ views: number; holds: number; holdRate: number; avgHoldDuration: number; chart: Array<{ date: string; views: number }> } | null>(null)
  const [replacingA, setReplacingA] = useState(false)
  const [replacingB, setReplacingB] = useState(false)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.vidsyncro.com'
  const clientEmbedUrl = project?.clientSlug
    ? `https://${project.clientSlug}.vidframe.io/${project.id}`
    : null
  const embedUrl = clientEmbedUrl || (project ? `https://embed.vidsyncro.com/${project.id}` : '')
  const iframeCode = project
    ? `<iframe src="${embedUrl}" width="100%" style="aspect-ratio:16/9;border:none;" allowfullscreen></iframe>`
    : ''

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(data => {
        // map snake_case
        setProject({
          id: data.id, userId: data.user_id, title: data.title, slug: data.slug,
          description: data.description, videoA: data.video_a, videoB: data.video_b,
          overlayConfig: data.overlay_config, embedConfig: data.embed_config,
          clientSlug: data.client_slug || null,
          status: data.status, totalViews: data.total_views, totalInteractions: data.total_interactions,
          createdAt: data.created_at, updatedAt: data.updated_at,
        })
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (project && activeTab === 'Analytics') {
      fetch(`/api/analytics?projectId=${project.id}&days=30`)
        .then(r => r.json())
        .then(setAnalytics)
    }
  }, [project, activeTab])

  const save = useCallback(async () => {
    if (!project) return
    setSaving(true)
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: project.title,
        description: project.description,
        overlay_config: project.overlayConfig,
        embed_config: project.embedConfig,
        client_slug: project.clientSlug || null,
        status: project.status,
      }),
    })
    setSaving(false)
  }, [project, id])

  const updateOverlay = (patch: Partial<OverlayConfig>) =>
    setProject(p => p ? { ...p, overlayConfig: { ...p.overlayConfig, ...patch } } : p)

  const updateEmbed = (patch: Partial<EmbedConfig>) =>
    setProject(p => p ? { ...p, embedConfig: { ...p.embedConfig, ...patch } } : p)

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-zinc-950">
      <div className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
    </div>
  )
  if (!project) return <div className="text-zinc-400 p-8">Project not found</div>

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-zinc-900/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="text-zinc-500 hover:text-white transition-colors">
            ← Back
          </button>
          <input
            value={project.title}
            onChange={e => setProject(p => p ? { ...p, title: e.target.value } : p)}
            className="bg-transparent text-white font-semibold text-lg focus:outline-none border-b border-transparent focus:border-violet-500 transition-colors"
          />
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            project.status === 'published' ? 'bg-green-500/10 text-green-400' :
            project.status === 'archived' ? 'bg-zinc-500/10 text-zinc-400' :
            'bg-yellow-500/10 text-yellow-400'
          }`}>
            {project.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={project.status}
            onChange={e => setProject(p => p ? { ...p, status: e.target.value as Project['status'] } : p)}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-white/10 text-sm text-white focus:outline-none focus:border-violet-500"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
          <a href={embedUrl} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-white/10 text-sm text-zinc-300 hover:text-white hover:border-white/20 transition-colors">
            View Embed ↗
          </a>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-80 flex-shrink-0 border-r border-white/5 bg-zinc-900/30 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/5">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-xs font-medium transition-colors ${
                  activeTab === tab ? 'text-violet-400 border-b-2 border-violet-500' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* ── VIDEOS TAB ── */}
            {activeTab === 'Videos' && (
              <div className="space-y-4">
                {(['A', 'B'] as const).map(slot => {
                  const asset = slot === 'A' ? project.videoA : project.videoB
                  const replacing = slot === 'A' ? replacingA : replacingB
                  const setReplacing = slot === 'A' ? setReplacingA : setReplacingB
                  return (
                    <div key={slot} className="rounded-xl bg-zinc-800/50 border border-white/5 overflow-hidden">
                      <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between">
                        <span className="text-sm font-medium text-zinc-300">Reality {slot}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            asset?.status === 'ready' ? 'bg-green-500/10 text-green-400' :
                            asset?.status === 'preparing' ? 'bg-yellow-500/10 text-yellow-400' :
                            asset?.status === 'errored' ? 'bg-red-500/10 text-red-400' :
                            'bg-zinc-600/30 text-zinc-500'
                          }`}>
                            {asset?.status || 'No video'}
                          </span>
                          {asset && !replacing && (
                            <button
                              onClick={() => setReplacing(true)}
                              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                            >
                              Replace
                            </button>
                          )}
                        </div>
                      </div>
                      {replacing ? (
                        <div className="p-3">
                          <UploadZone
                            label={`New Reality ${slot} video`}
                            projectId={project.id}
                            videoSlot={slot.toLowerCase() as 'a' | 'b'}
                            onUploadComplete={(assetId, playbackId) => {
                              setProject(p => {
                                if (!p) return p
                                const newAsset = {
                                  id: assetId,
                                  muxAssetId: null,
                                  muxPlaybackId: playbackId,
                                  muxUploadId: assetId,
                                  status: 'ready' as const,
                                  duration: null,
                                  aspectRatio: null,
                                  thumbnailUrl: null,
                                }
                                return slot === 'A'
                                  ? { ...p, videoA: newAsset }
                                  : { ...p, videoB: newAsset }
                              })
                              setReplacing(false)
                            }}
                            onUploadError={(err) => { alert(err); setReplacing(false) }}
                          />
                          <button
                            onClick={() => setReplacing(false)}
                            className="mt-2 w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          {asset?.thumbnailUrl ? (
                            <img src={asset.thumbnailUrl} alt={`Reality ${slot} thumbnail`} className="w-full aspect-video object-cover" />
                          ) : (
                            <div className="p-3">
                              <UploadZone
                                label={`Upload Reality ${slot} video`}
                                projectId={project.id}
                                videoSlot={slot.toLowerCase() as 'a' | 'b'}
                                onUploadComplete={(assetId, playbackId) => {
                                  setProject(p => {
                                    if (!p) return p
                                    const newAsset = {
                                      id: assetId,
                                      muxAssetId: null,
                                      muxPlaybackId: playbackId,
                                      muxUploadId: assetId,
                                      status: 'ready' as const,
                                      duration: null,
                                      aspectRatio: null,
                                      thumbnailUrl: null,
                                    }
                                    return slot === 'A'
                                      ? { ...p, videoA: newAsset }
                                      : { ...p, videoB: newAsset }
                                  })
                                }}
                                onUploadError={(err) => alert(err)}
                              />
                            </div>
                          )}
                          {asset?.duration && (
                            <div className="px-3 py-2 text-xs text-zinc-500">
                              Duration: {Math.floor(asset.duration / 60)}:{String(asset.duration % 60).padStart(2, '0')}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── OVERLAY TAB ── */}
            {activeTab === 'Overlay' && (
              <div className="space-y-4">
                <div>
                  <Label>Interaction Mode</Label>
                  <Select value={project.overlayConfig.switchMode} onChange={e => updateOverlay({ switchMode: e.target.value as OverlayConfig['switchMode'] })}>
                    <option value="hold">Hold to reveal</option>
                    <option value="toggle">Click to toggle</option>
                    <option value="hover">Hover to reveal</option>
                  </Select>
                </div>
                <div>
                  <Label>Transition Style</Label>
                  <Select value={project.overlayConfig.transitionType} onChange={e => updateOverlay({ transitionType: e.target.value as OverlayConfig['transitionType'] })}>
                    <option value="crossfade">Crossfade</option>
                    <option value="slide-left">Slide Left</option>
                    <option value="slide-right">Slide Right</option>
                    <option value="zoom">Zoom</option>
                    <option value="blur-reveal">Blur Reveal</option>
                  </Select>
                </div>
                <div>
                  <Label>Transition Speed: {project.overlayConfig.transitionDuration}ms</Label>
                  <input
                    type="range" min={50} max={500} step={25}
                    value={project.overlayConfig.transitionDuration}
                    onChange={e => updateOverlay({ transitionDuration: Number(e.target.value) })}
                    className="w-full accent-violet-500"
                  />
                </div>
                {/* ── Hint / Prompt text ── */}
                <div className="rounded-xl bg-zinc-900/60 border border-white/5 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Hint Badge</span>
                    <Toggle checked={project.overlayConfig.showHint} onChange={v => updateOverlay({ showHint: v })} label="" />
                  </div>
                  <div>
                    <Label>Prompt text (shown on Reality A)</Label>
                    <Input
                      value={project.overlayConfig.hintText}
                      placeholder={project.overlayConfig.switchMode === 'hold' ? 'Hold to reveal' : project.overlayConfig.switchMode === 'toggle' ? 'Tap to switch' : 'Hover to reveal'}
                      onChange={e => updateOverlay({ hintText: e.target.value })}
                    />
                    <p className="text-xs text-zinc-600 mt-1">Leave blank to use the default for the selected interaction mode.</p>
                  </div>
                  <div>
                    <Label>Position</Label>
                    <Select value={project.overlayConfig.hintPosition} onChange={e => updateOverlay({ hintPosition: e.target.value as OverlayConfig['hintPosition'] })}>
                      <option value="bottom-center">Bottom Center</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                      <option value="top-center">Top Center</option>
                    </Select>
                  </div>
                </div>
                {/* ── Reality labels ── */}
                <div className="rounded-xl bg-zinc-900/60 border border-white/5 p-3 space-y-3">
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Reality Labels</span>
                  <div>
                    <Label>Reality A label (default view)</Label>
                    <Input
                      value={project.overlayConfig.labelA || ''}
                      placeholder="e.g. Before"
                      onChange={e => updateOverlay({ labelA: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Reality B label (revealed view)</Label>
                    <Input
                      value={project.overlayConfig.labelB || ''}
                      placeholder="e.g. After"
                      onChange={e => updateOverlay({ labelB: e.target.value })}
                    />
                  </div>
                  <p className="text-xs text-zinc-600">Leave blank to hide the label badge entirely.</p>
                </div>
                <Toggle checked={project.overlayConfig.showSwitchIndicator} onChange={v => updateOverlay({ showSwitchIndicator: v })} label="Switch Indicator" />
                {project.overlayConfig.showSwitchIndicator && (
                  <div>
                    <Label>Indicator Color</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={project.overlayConfig.indicatorColor} onChange={e => updateOverlay({ indicatorColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer bg-transparent" />
                      <Input value={project.overlayConfig.indicatorColor} onChange={e => updateOverlay({ indicatorColor: e.target.value })} />
                    </div>
                  </div>
                )}
                <Toggle checked={project.overlayConfig.autoSwitchEnabled} onChange={v => updateOverlay({ autoSwitchEnabled: v })} label="Auto-Switch" />
                {project.overlayConfig.autoSwitchEnabled && (
                  <div>
                    <Label>Auto-Switch Interval: {project.overlayConfig.autoSwitchInterval}s</Label>
                    <input type="range" min={2} max={30} step={1} value={project.overlayConfig.autoSwitchInterval} onChange={e => updateOverlay({ autoSwitchInterval: Number(e.target.value) })} className="w-full accent-violet-500" />
                  </div>
                )}
                <Toggle checked={project.overlayConfig.brandingVisible} onChange={v => updateOverlay({ brandingVisible: v })} label="Show Branding" />
                {project.overlayConfig.brandingVisible && (
                  <>
                    <div><Label>Branding Text</Label><Input value={project.overlayConfig.brandingText} onChange={e => updateOverlay({ brandingText: e.target.value })} /></div>
                    <div><Label>Branding URL</Label><Input value={project.overlayConfig.brandingUrl} onChange={e => updateOverlay({ brandingUrl: e.target.value })} /></div>
                  </>
                )}
              </div>
            )}

            {/* ── EMBED TAB ── */}
            {activeTab === 'Embed' && (
              <div className="space-y-4">
                <div>
                  <Label>Client Slug</Label>
                  <p className="text-zinc-500 text-xs mb-2">Sets the branded URL: <span className="text-violet-400 font-mono">[slug].vidframe.io/{project?.id}</span>. Leave blank to use the default embed URL.</p>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-xs font-mono whitespace-nowrap">https://</span>
                    <input
                      value={project?.clientSlug || ''}
                      onChange={e => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                        setProject(p => p ? { ...p, clientSlug: val || null } : p)
                      }}
                      placeholder="pepsi"
                      className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-sm text-white font-mono focus:outline-none focus:border-violet-500 transition-colors"
                    />
                    <span className="text-zinc-500 text-xs font-mono whitespace-nowrap">.vidframe.io</span>
                  </div>
                  {project?.clientSlug && (
                    <div className="mt-2 p-3 rounded-lg bg-violet-900/20 border border-violet-500/20">
                      <p className="text-xs text-violet-300 font-medium mb-1">✓ Client URL ready</p>
                      <p className="text-xs text-zinc-400 font-mono break-all">https://{project.clientSlug}.vidframe.io/{project?.id}</p>
                      <p className="text-xs text-zinc-500 mt-1">No DNS setup needed — wildcard already configured.</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Embed Code</Label>
                  <div className="relative">
                    <textarea
                      readOnly
                      value={iframeCode}
                      className="w-full h-24 px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-xs text-zinc-300 font-mono resize-none focus:outline-none"
                    />
                    <button
                      onClick={() => navigator.clipboard.writeText(iframeCode)}
                      className="absolute top-2 right-2 px-2 py-1 rounded bg-violet-600/80 hover:bg-violet-600 text-xs text-white transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <div>
                  <Label>Direct URL</Label>
                  <div className="flex items-center gap-2">
                    <input readOnly value={embedUrl} className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-white/10 text-xs text-zinc-300 font-mono focus:outline-none" />
                    <button onClick={() => navigator.clipboard.writeText(embedUrl)} className="px-3 py-2 rounded-lg bg-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors">Copy</button>
                  </div>
                </div>
                <Toggle checked={project.embedConfig.autoplay} onChange={v => updateEmbed({ autoplay: v })} label="Autoplay" />
                <Toggle checked={project.embedConfig.muted} onChange={v => updateEmbed({ muted: v })} label="Muted" />
                <Toggle checked={project.embedConfig.loop} onChange={v => updateEmbed({ loop: v })} label="Loop" />
                <Toggle checked={project.embedConfig.allowFullscreen} onChange={v => updateEmbed({ allowFullscreen: v })} label="Allow Fullscreen" />
                <Toggle checked={project.embedConfig.passwordProtected} onChange={v => updateEmbed({ passwordProtected: v })} label="Password Protect" />
                {project.embedConfig.passwordProtected && (
                  <div><Label>Password</Label><Input type="password" value={project.embedConfig.password || ''} onChange={e => updateEmbed({ password: e.target.value })} placeholder="Set a password" /></div>
                )}
                <div>
                  <Label>Background Color</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={project.embedConfig.backgroundColor} onChange={e => updateEmbed({ backgroundColor: e.target.value })} className="w-10 h-10 rounded cursor-pointer bg-transparent" />
                    <Input value={project.embedConfig.backgroundColor} onChange={e => updateEmbed({ backgroundColor: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {/* ── ANALYTICS TAB ── */}
            {activeTab === 'Analytics' && (
              <div className="space-y-4">
                {analytics ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Views', value: analytics.views },
                        { label: 'Holds', value: analytics.holds },
                        { label: 'Hold Rate', value: `${analytics.holdRate}%` },
                        { label: 'Avg Hold', value: `${analytics.avgHoldDuration}s` },
                      ].map(stat => (
                        <div key={stat.label} className="rounded-xl bg-zinc-800/50 border border-white/5 p-3 text-center">
                          <div className="text-xl font-bold text-white">{stat.value}</div>
                          <div className="text-xs text-zinc-500 mt-0.5">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    {analytics.chart.length > 0 && (
                      <div>
                        <Label>Views (30 days)</Label>
                        <div className="flex items-end gap-1 h-20 mt-2">
                          {analytics.chart.slice(-14).map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                              <div
                                className="w-full bg-violet-600/60 rounded-sm"
                                style={{ height: `${Math.max(4, (d.views / Math.max(...analytics.chart.map(x => x.views), 1)) * 64)}px` }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-zinc-500 text-sm">Loading analytics…</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: live preview */}
        <div className="flex-1 bg-zinc-950 flex flex-col items-center justify-center p-4 overflow-auto">
          <div className="text-xs text-zinc-600 text-center mb-3 uppercase tracking-widest">Live Preview</div>
          {(() => {
            const raw = project.videoA?.aspectRatio || project.videoB?.aspectRatio || '16:9'
            const [w, h] = raw.split(':').map(Number)
            const ar = (w && h) ? w / h : 16 / 9
            // Portrait (9:16) → constrain by height; landscape → constrain by width
            const isPortrait = ar < 1
            return (
              <div
                style={isPortrait
                  ? { height: 'min(70vh, 560px)', aspectRatio: String(ar), position: 'relative' }
                  : { width: '100%', maxWidth: 720, aspectRatio: String(ar), position: 'relative' }
                }
              >
                <VidSyncroPlayer project={project} preview />
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
