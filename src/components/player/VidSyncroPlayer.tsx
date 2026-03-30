'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Project } from '@/types'

interface VidSyncroPlayerProps {
  project: Project
  onAnalyticsEvent?: (type: string, data: Record<string, unknown>) => void
  preview?: boolean
}

function getMuxHlsUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`
}

function getMuxThumbUrl(playbackId: string, time = 0) {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}&width=640`
}

export default function VidSyncroPlayer({ project, onAnalyticsEvent, preview = false }: VidSyncroPlayerProps) {
  const videoARef = useRef<HTMLVideoElement>(null)
  const videoBRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const holdStartRef = useRef<number | null>(null)
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const autoSwitchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionIdRef = useRef<string>(Math.random().toString(36).slice(2))
  const viewTrackedRef = useRef(false)
  const contextMenuBlockedRef = useRef(false)

  const [showingB, setShowingB] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [loadingA, setLoadingA] = useState(true)
  const [loadingB, setLoadingB] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [switchFlash, setSwitchFlash] = useState(false)
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(
    !project.embedConfig.passwordProtected
  )
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { overlayConfig: oc, embedConfig: ec } = project
  const videoA = project.videoA
  const videoB = project.videoB
  const ready = !!videoA?.muxPlaybackId && !!videoB?.muxPlaybackId

  // ── Analytics ──────────────────────────────────────────────────────────────
  const trackEvent = useCallback(
    (type: string, data: Record<string, unknown> = {}) => {
      if (preview) return
      const payload = { projectId: project.id, sessionId: sessionIdRef.current, event_type: type, metadata: data }
      onAnalyticsEvent?.(type, payload)
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {})
    },
    [project.id, preview, onAnalyticsEvent]
  )

  // ── Track view once ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!viewTrackedRef.current && isPasswordUnlocked) {
      viewTrackedRef.current = true
      trackEvent('view')
    }
  }, [isPasswordUnlocked, trackEvent])

  // ── Sync engine ─────────────────────────────────────────────────────────────
  const syncVideos = useCallback(() => {
    const a = videoARef.current
    const b = videoBRef.current
    if (!a || !b) return
    const diff = Math.abs(a.currentTime - b.currentTime)
    if (diff > 0.5) {
      b.currentTime = a.currentTime
    }
  }, [])

  useEffect(() => {
    syncIntervalRef.current = setInterval(syncVideos, 500)
    return () => { if (syncIntervalRef.current) clearInterval(syncIntervalRef.current) }
  }, [syncVideos])

  // ── Auto-switch ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!oc.autoSwitchEnabled || !isPlaying) return
    autoSwitchIntervalRef.current = setInterval(() => {
      setShowingB(prev => !prev)
    }, (oc.autoSwitchInterval || 5) * 1000)
    return () => { if (autoSwitchIntervalRef.current) clearInterval(autoSwitchIntervalRef.current) }
  }, [oc.autoSwitchEnabled, oc.autoSwitchInterval, isPlaying])

  // ── Switch to B ─────────────────────────────────────────────────────────────
  const switchToB = useCallback(() => {
    const a = videoARef.current
    const b = videoBRef.current
    if (!b || !a) return
    b.currentTime = a.currentTime
    b.play().catch(() => {})
    setShowingB(true)
    setSwitchFlash(true)
    setTimeout(() => setSwitchFlash(false), 300)
    holdStartRef.current = Date.now()
    if (oc.showHint) setShowHint(false)
    trackEvent('hold_start', { currentTime: a.currentTime })
  }, [oc.showHint, trackEvent])

  // ── Switch to A ─────────────────────────────────────────────────────────────
  const switchToA = useCallback(() => {
    const a = videoARef.current
    const b = videoBRef.current
    if (!a || !b) return
    a.currentTime = b.currentTime
    setShowingB(false)
    if (holdStartRef.current) {
      const duration = (Date.now() - holdStartRef.current) / 1000
      trackEvent('hold_end', { duration, currentTime: b.currentTime })
      holdStartRef.current = null
    }
  }, [trackEvent])

  // ── Interaction handlers ─────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    if (oc.switchMode === 'hold') switchToB()
    else if (oc.switchMode === 'toggle') {
      if (showingB) switchToA(); else switchToB()
    }
  }, [oc.switchMode, showingB, switchToA, switchToB])

  const handleMouseUp = useCallback(() => {
    if (oc.switchMode === 'hold') switchToA()
  }, [oc.switchMode, switchToA])

  const handleMouseLeave = useCallback(() => {
    if (oc.switchMode === 'hold' && showingB) switchToA()
    if (oc.switchMode === 'hover' && showingB) switchToA()
  }, [oc.switchMode, showingB, switchToA])

  const handleMouseEnter = useCallback(() => {
    if (oc.switchMode === 'hover') switchToB()
  }, [oc.switchMode, switchToB])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (oc.switchMode === 'hold') switchToB()
    else if (oc.switchMode === 'toggle') {
      if (showingB) switchToA(); else switchToB()
    }
    if ('vibrate' in navigator) navigator.vibrate(30)
  }, [oc.switchMode, showingB, switchToA, switchToB])

  const handleTouchEnd = useCallback(() => {
    if (oc.switchMode === 'hold') switchToA()
  }, [oc.switchMode, switchToA])

  // ── Keyboard ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        const a = videoARef.current
        if (!a) return
        if (a.paused) { a.play(); videoBRef.current?.play() }
        else { a.pause(); videoBRef.current?.pause() }
      }
      if (e.code === 'KeyH') {
        e.type === 'keydown' ? switchToB() : switchToA()
      }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey) }
  }, [switchToA, switchToB])

  // ── Play/Pause control ───────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const a = videoARef.current
    const b = videoBRef.current
    if (!a || !b) return
    if (a.paused) {
      a.play().catch(() => {})
      b.play().catch(() => {})
      setIsPlaying(true)
    } else {
      a.pause()
      b.pause()
      setIsPlaying(false)
    }
  }, [])

  // ── Fullscreen ───────────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // ── Show/hide controls ────────────────────────────────────────────────────────
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500)
  }, [])

  // ── Loading state ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loadingA && !loadingB) setIsLoaded(true)
  }, [loadingA, loadingB])

  // ── Transition styles ─────────────────────────────────────────────────────────
  const transitionStyle: React.CSSProperties = {
    transition: `opacity ${oc.transitionDuration}ms ease, transform ${oc.transitionDuration}ms ease, filter ${oc.transitionDuration}ms ease`,
  }

  const getVideoAStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { ...transitionStyle, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
    if (oc.transitionType === 'crossfade') return { ...base, opacity: showingB ? 0 : 1, zIndex: showingB ? 1 : 2 }
    if (oc.transitionType === 'slide-left') return { ...base, opacity: 1, transform: showingB ? 'translateX(-100%)' : 'translateX(0)', zIndex: showingB ? 1 : 2 }
    if (oc.transitionType === 'slide-right') return { ...base, opacity: 1, transform: showingB ? 'translateX(100%)' : 'translateX(0)', zIndex: showingB ? 1 : 2 }
    if (oc.transitionType === 'zoom') return { ...base, opacity: showingB ? 0 : 1, transform: showingB ? 'scale(1.08)' : 'scale(1)', zIndex: showingB ? 1 : 2 }
    if (oc.transitionType === 'blur-reveal') return { ...base, opacity: showingB ? 0 : 1, filter: showingB ? 'blur(12px)' : 'blur(0px)', zIndex: showingB ? 1 : 2 }
    return { ...base, opacity: showingB ? 0 : 1, zIndex: 2 }
  }

  const getVideoBStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { ...transitionStyle, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
    if (oc.transitionType === 'crossfade') return { ...base, opacity: showingB ? 1 : 0, zIndex: showingB ? 2 : 1 }
    if (oc.transitionType === 'slide-left') return { ...base, opacity: 1, transform: showingB ? 'translateX(0)' : 'translateX(100%)', zIndex: showingB ? 2 : 1 }
    if (oc.transitionType === 'slide-right') return { ...base, opacity: 1, transform: showingB ? 'translateX(0)' : 'translateX(-100%)', zIndex: showingB ? 2 : 1 }
    if (oc.transitionType === 'zoom') return { ...base, opacity: showingB ? 1 : 0, transform: showingB ? 'scale(1)' : 'scale(0.95)', zIndex: showingB ? 2 : 1 }
    if (oc.transitionType === 'blur-reveal') return { ...base, opacity: showingB ? 1 : 0, filter: showingB ? 'blur(0px)' : 'blur(8px)', zIndex: showingB ? 2 : 1 }
    return { ...base, opacity: showingB ? 1 : 0, zIndex: 1 }
  }

  // ── Hint position ─────────────────────────────────────────────────────────────
  const hintPositionClass: Record<string, string> = {
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
  }

  // ── Password screen ────────────────────────────────────────────────────────────
  if (!isPasswordUnlocked) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-zinc-950 rounded-xl">
        <div className="text-center p-8 max-w-sm w-full">
          <div className="w-14 h-14 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-lg mb-1">Password Required</h3>
          <p className="text-zinc-400 text-sm mb-6">Enter the password to view this video</p>
          <input
            type="password"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (passwordInput === project.embedConfig.password) {
                  setIsPasswordUnlocked(true)
                } else {
                  setPasswordError(true)
                  setTimeout(() => setPasswordError(false), 2000)
                }
              }
            }}
            placeholder="Enter password"
            className={`w-full px-4 py-3 rounded-xl bg-zinc-800 border ${passwordError ? 'border-red-500' : 'border-white/10'} text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-violet-500 transition-colors`}
          />
          {passwordError && <p className="text-red-400 text-xs mt-2">Incorrect password</p>}
          <button
            onClick={() => {
              if (passwordInput === project.embedConfig.password) {
                setIsPasswordUnlocked(true)
              } else {
                setPasswordError(true)
                setTimeout(() => setPasswordError(false), 2000)
              }
            }}
            className="w-full mt-3 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
          >
            Unlock
          </button>
        </div>
      </div>
    )
  }

  // ── No videos yet ─────────────────────────────────────────────────────────────
  if (!ready) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-zinc-950 rounded-xl">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <p className="text-zinc-400 text-sm">Videos processing…</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl select-none"
      style={{
        aspectRatio: videoA.aspectRatio?.replace(':', '/') || '16/9',
        backgroundColor: ec.backgroundColor || '#000',
        cursor: oc.switchMode === 'hold' ? 'pointer' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onMouseMove={showControlsTemporarily}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={e => e.preventDefault()}
    >
      {/* ── Video A ── */}
      <video
        ref={videoARef}
        src={getMuxHlsUrl(videoA.muxPlaybackId!)}
        style={getVideoAStyle()}
        playsInline
        muted={ec.muted}
        loop={ec.loop}
        autoPlay={ec.autoplay}
        preload="auto"
        onCanPlay={() => setLoadingA(false)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        poster={getMuxThumbUrl(videoA.muxPlaybackId!)}
      />

      {/* ── Video B ── */}
      <video
        ref={videoBRef}
        src={getMuxHlsUrl(videoB!.muxPlaybackId!)}
        style={getVideoBStyle()}
        playsInline
        muted
        loop={ec.loop}
        autoPlay={ec.autoplay}
        preload="auto"
        onCanPlay={() => setLoadingB(false)}
        poster={getMuxThumbUrl(videoB!.muxPlaybackId!)}
      />

      {/* ── Loading skeleton ── */}
      {!isLoaded && (
        <div className="absolute inset-0 z-50 bg-zinc-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
            <p className="text-zinc-500 text-xs">Loading dual stream…</p>
          </div>
        </div>
      )}

      {/* ── Switch flash indicator ── */}
      {oc.showSwitchIndicator && switchFlash && (
        <div
          className="absolute inset-0 z-30 rounded-xl pointer-events-none"
          style={{
            boxShadow: `inset 0 0 0 2px ${oc.indicatorColor || '#8b5cf6'}, 0 0 30px ${oc.indicatorColor || '#8b5cf6'}40`,
            transition: 'opacity 0.15s ease',
          }}
        />
      )}

      {/* ── Hint badge ── */}
      {oc.showHint && showHint && isLoaded && !showingB && (
        <div className={`absolute z-20 pointer-events-none ${hintPositionClass[oc.hintPosition] || hintPositionClass['bottom-center']}`}>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-sm text-white whitespace-nowrap">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: oc.indicatorColor || '#8b5cf6', animation: 'pulse 2s infinite' }}
            />
            {oc.hintText || (oc.switchMode === 'hold' ? 'Hold to reveal' : oc.switchMode === 'toggle' ? 'Click to switch' : 'Hover to reveal')}
          </div>
        </div>
      )}

      {/* ── Reality B indicator ── */}
      {showingB && (
        <div className="absolute top-3 right-3 z-20 pointer-events-none">
          <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/30 text-xs text-cyan-300 font-medium">
            Reality B
          </div>
        </div>
      )}

      {/* ── Controls overlay ── */}
      {(showControls || !isPlaying) && isLoaded && (
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%)',
          }}
        >
          {/* Play/pause center */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto" onClick={togglePlay}>
            {!isPlaying && (
              <div className="w-16 h-16 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/25 transition-colors">
                <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 pb-3 pt-8 pointer-events-auto">
            <button onClick={togglePlay} className="text-white/70 hover:text-white transition-colors">
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            {ec.allowFullscreen && (
              <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M15 9h4.5M15 9V4.5M9 15v4.5M9 15H4.5M15 15h4.5M15 15v4.5" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Branding ── */}
      {oc.brandingVisible && oc.brandingText && (
        <div className="absolute bottom-2 left-3 z-10 pointer-events-none">
          <a
            href={oc.brandingUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/30 text-xs hover:text-white/60 transition-colors pointer-events-auto"
          >
            {oc.brandingText}
          </a>
        </div>
      )}
    </div>
  )
}
