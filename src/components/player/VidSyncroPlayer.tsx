'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Project } from '@/types'
import Hls from 'hls.js'

// ── HLS attachment ────────────────────────────────────────────────────────────
function attachHls(
  videoEl: HTMLVideoElement,
  src: string,
  onReady: () => void,
): Hls | null {
  if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
    // Safari native HLS
    videoEl.src = src
    videoEl.addEventListener('canplay', onReady, { once: true })
    return null
  } else if (Hls.isSupported()) {
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      // Buffer aggressively so both videos stay ahead
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
    })
    hls.loadSource(src)
    hls.attachMedia(videoEl)
    hls.on(Hls.Events.MANIFEST_PARSED, onReady)
    return hls
  }
  return null
}

function getMuxHlsUrl(playbackId: string) {
  return `https://stream.mux.com/${playbackId}.m3u8`
}
function getMuxThumbUrl(playbackId: string, time = 0) {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}&width=1280`
}

interface VidSyncroPlayerProps {
  project: Project
  onAnalyticsEvent?: (type: string, data: Record<string, unknown>) => void
  preview?: boolean
}

export default function VidSyncroPlayer({
  project,
  onAnalyticsEvent,
  preview = false,
}: VidSyncroPlayerProps) {
  const videoARef = useRef<HTMLVideoElement>(null)
  const videoBRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsARef = useRef<Hls | null>(null)
  const hlsBRef = useRef<Hls | null>(null)

  // Interaction refs
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pointerDownTimeRef = useRef<number>(0)
  const holdStartRef = useRef<number | null>(null)
  const autoSwitchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionIdRef = useRef<string>(Math.random().toString(36).slice(2))
  const viewTrackedRef = useRef(false)

  // UI state
  const [showingB, setShowingB] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loadedA, setLoadedA] = useState(false)
  const [loadedB, setLoadedB] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [switchFlash, setSwitchFlash] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(
    !project.embedConfig.passwordProtected,
  )
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)

  const isLoaded = loadedA && loadedB
  const { overlayConfig: oc, embedConfig: ec } = project
  const videoA = project.videoA
  const videoB = project.videoB
  const ready = !!videoA?.muxPlaybackId && !!videoB?.muxPlaybackId

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(hover: none) and (pointer: coarse)').matches)
  }, [])

  // ── Analytics ─────────────────────────────────────────────────────────────
  const trackEvent = useCallback(
    (type: string, data: Record<string, unknown> = {}) => {
      if (preview) return
      const payload = {
        projectId: project.id,
        sessionId: sessionIdRef.current,
        event_type: type,
        metadata: data,
      }
      onAnalyticsEvent?.(type, payload)
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {})
    },
    [project.id, preview, onAnalyticsEvent],
  )

  useEffect(() => {
    if (!viewTrackedRef.current && isPasswordUnlocked) {
      viewTrackedRef.current = true
      trackEvent('view')
    }
  }, [isPasswordUnlocked, trackEvent])

  // ── Attach HLS — both videos load in parallel ─────────────────────────────
  useEffect(() => {
    const a = videoARef.current
    if (!a || !videoA?.muxPlaybackId) return
    hlsARef.current = attachHls(a, getMuxHlsUrl(videoA.muxPlaybackId), () => setLoadedA(true))
    return () => { hlsARef.current?.destroy(); hlsARef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoA?.muxPlaybackId])

  useEffect(() => {
    const b = videoBRef.current
    if (!b || !videoB?.muxPlaybackId) return
    hlsBRef.current = attachHls(b, getMuxHlsUrl(videoB.muxPlaybackId), () => setLoadedB(true))
    return () => { hlsBRef.current?.destroy(); hlsBRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoB?.muxPlaybackId])

  // ── Start both videos together once both are ready ────────────────────────
  // Both videos play simultaneously at all times. Switching is purely visual
  // (CSS opacity). This eliminates ALL sync/stall/feedback-loop issues.
  useEffect(() => {
    if (!isLoaded) return
    const a = videoARef.current
    const b = videoBRef.current
    if (!a || !b) return

    if (ec.autoplay) {
      // Mute both initially so autoplay is allowed by the browser,
      // then unmute the active one after play starts
      a.muted = true
      b.muted = true
      Promise.all([a.play().catch(() => {}), b.play().catch(() => {})]).then(() => {
        setIsPlaying(true)
        // Unmute the active video (A by default), keep B muted
        if (!ec.muted) {
          a.muted = false
          b.muted = true
        }
      })
    }

    // Show controls briefly on load for touch devices
    if (isTouchDevice) {
      setShowControls(true)
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded])

  // ── Play / Pause — always operates on BOTH videos ─────────────────────────
  const playBoth = useCallback(() => {
    const a = videoARef.current
    const b = videoBRef.current
    if (!a || !b) return
    Promise.all([a.play().catch(() => {}), b.play().catch(() => {})]).then(() => {
      setIsPlaying(true)
    })
  }, [])

  const pauseBoth = useCallback(() => {
    const a = videoARef.current
    const b = videoBRef.current
    if (!a || !b) return
    a.pause()
    b.pause()
    setIsPlaying(false)
  }, [])

  const togglePlay = useCallback(() => {
    const a = videoARef.current
    if (!a) return
    if (a.paused) playBoth(); else pauseBoth()
  }, [playBoth, pauseBoth])

  // ── Switch — pure CSS, no play/pause calls ────────────────────────────────
  const switchToB = useCallback(() => {
    const a = videoARef.current
    const b = videoBRef.current
    if (!a || !b) return
    // Audio: mute A, unmute B (unless global mute is on)
    if (!ec.muted) { a.muted = true; b.muted = false }
    setShowingB(true)
    setSwitchFlash(true)
    setTimeout(() => setSwitchFlash(false), 300)
    holdStartRef.current = Date.now()
    if (oc.showHint) setShowHint(false)
    trackEvent('hold_start', { currentTime: a.currentTime })
  }, [oc.showHint, ec.muted, trackEvent])

  const switchToA = useCallback(() => {
    const a = videoARef.current
    const b = videoBRef.current
    if (!a || !b) return
    // Audio: unmute A, mute B (unless global mute is on)
    if (!ec.muted) { b.muted = true; a.muted = false }
    setShowingB(false)
    if (holdStartRef.current) {
      const duration = (Date.now() - holdStartRef.current) / 1000
      trackEvent('hold_end', { duration, currentTime: b.currentTime })
      holdStartRef.current = null
    }
  }, [ec.muted, trackEvent])

  // ── Auto-switch ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!oc.autoSwitchEnabled || !isPlaying) return
    autoSwitchIntervalRef.current = setInterval(() => {
      setShowingB(prev => !prev)
    }, (oc.autoSwitchInterval || 5) * 1000)
    return () => { if (autoSwitchIntervalRef.current) clearInterval(autoSwitchIntervalRef.current) }
  }, [oc.autoSwitchEnabled, oc.autoSwitchInterval, isPlaying])

  // ── Mouse handlers ────────────────────────────────────────────────────────
  const HOLD_THRESHOLD = 200

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      if (oc.switchMode === 'hold') {
        pointerDownTimeRef.current = Date.now()
        holdTimerRef.current = setTimeout(() => switchToB(), HOLD_THRESHOLD)
      } else if (oc.switchMode === 'toggle') {
        if (showingB) switchToA(); else switchToB()
      }
    },
    [oc.switchMode, showingB, switchToA, switchToB],
  )

  const handleMouseUp = useCallback(() => {
    if (oc.switchMode === 'hold') {
      if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null }
      const elapsed = Date.now() - pointerDownTimeRef.current
      if (elapsed < HOLD_THRESHOLD) togglePlay(); else switchToA()
    }
  }, [oc.switchMode, switchToA, togglePlay])

  const handleMouseLeave = useCallback(() => {
    if (oc.switchMode === 'hold' && showingB) {
      if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null }
      switchToA()
    }
  }, [oc.switchMode, showingB, switchToA])

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      if (oc.switchMode === 'hover') {
        if (e.buttons === 0) switchToB()
      }
    },
    [oc.switchMode, switchToB],
  )

  // ── Touch handlers ────────────────────────────────────────────────────────
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') return
      if (oc.switchMode === 'hold') {
        pointerDownTimeRef.current = Date.now()
        holdTimerRef.current = setTimeout(() => {
          switchToB()
          if ('vibrate' in navigator) navigator.vibrate(30)
        }, HOLD_THRESHOLD)
      } else if (oc.switchMode === 'toggle') {
        if (showingB) switchToA(); else switchToB()
      }
    },
    [oc.switchMode, showingB, switchToA, switchToB],
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') return
      if (oc.switchMode === 'hold') {
        if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null }
        const elapsed = Date.now() - pointerDownTimeRef.current
        if (elapsed < HOLD_THRESHOLD) togglePlay(); else switchToA()
      }
    },
    [oc.switchMode, switchToA, togglePlay],
  )

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') { e.preventDefault(); togglePlay() }
      if (e.code === 'KeyH') { if (e.type === 'keydown') switchToB(); else switchToA() }
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey) }
  }, [togglePlay, switchToA, switchToB])

  // ── Fullscreen ────────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) containerRef.current.requestFullscreen().catch(() => {})
    else document.exitFullscreen().catch(() => {})
  }, [])

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // ── Controls auto-hide ────────────────────────────────────────────────────
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500)
  }, [])

  // ── Transition styles ─────────────────────────────────────────────────────
  const transitionStyle: React.CSSProperties = {
    transition: `opacity ${oc.transitionDuration}ms ease, transform ${oc.transitionDuration}ms ease, filter ${oc.transitionDuration}ms ease`,
  }

  const getVideoAStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      ...transitionStyle,
      position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
    }
    if (oc.transitionType === 'crossfade')   return { ...base, opacity: showingB ? 0 : 1, zIndex: showingB ? 1 : 2 }
    if (oc.transitionType === 'slide-left')  return { ...base, transform: showingB ? 'translateX(-100%)' : 'translateX(0)', zIndex: showingB ? 1 : 2 }
    if (oc.transitionType === 'slide-right') return { ...base, transform: showingB ? 'translateX(100%)' : 'translateX(0)', zIndex: showingB ? 1 : 2 }
    if (oc.transitionType === 'zoom')        return { ...base, opacity: showingB ? 0 : 1, transform: showingB ? 'scale(1.08)' : 'scale(1)', zIndex: showingB ? 1 : 2 }
    if (oc.transitionType === 'blur-reveal') return { ...base, opacity: showingB ? 0 : 1, filter: showingB ? 'blur(12px)' : 'blur(0px)', zIndex: showingB ? 1 : 2 }
    return { ...base, opacity: showingB ? 0 : 1, zIndex: 2 }
  }

  const getVideoBStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      ...transitionStyle,
      position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
    }
    if (oc.transitionType === 'crossfade')   return { ...base, opacity: showingB ? 1 : 0, zIndex: showingB ? 2 : 1 }
    if (oc.transitionType === 'slide-left')  return { ...base, transform: showingB ? 'translateX(0)' : 'translateX(100%)', zIndex: showingB ? 2 : 1 }
    if (oc.transitionType === 'slide-right') return { ...base, transform: showingB ? 'translateX(0)' : 'translateX(-100%)', zIndex: showingB ? 2 : 1 }
    if (oc.transitionType === 'zoom')        return { ...base, opacity: showingB ? 1 : 0, transform: showingB ? 'scale(1)' : 'scale(0.95)', zIndex: showingB ? 2 : 1 }
    if (oc.transitionType === 'blur-reveal') return { ...base, opacity: showingB ? 1 : 0, filter: showingB ? 'blur(0px)' : 'blur(8px)', zIndex: showingB ? 2 : 1 }
    return { ...base, opacity: showingB ? 1 : 0, zIndex: 1 }
  }

  const hintPositionClass: Record<string, string> = {
    'bottom-center': 'bottom-3 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
    'top-center': 'top-3 left-1/2 -translate-x-1/2',
  }

  // ── Password screen ───────────────────────────────────────────────────────
  if (!isPasswordUnlocked) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="bg-zinc-950">
        <div className="text-center p-6 w-full max-w-xs">
          <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-white font-semibold text-base mb-1">Password Required</h3>
          <p className="text-zinc-400 text-sm mb-4">Enter the password to view this video</p>
          <input
            type="password"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (passwordInput === project.embedConfig.password) setIsPasswordUnlocked(true)
                else { setPasswordError(true); setTimeout(() => setPasswordError(false), 2000) }
              }
            }}
            placeholder="Enter password"
            style={{ fontSize: 16 }}
            className={`w-full px-3 py-3 rounded-xl bg-zinc-800 border ${passwordError ? 'border-red-500' : 'border-white/10'} text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors`}
          />
          {passwordError && <p className="text-red-400 text-xs mt-2">Incorrect password</p>}
          <button
            onClick={() => {
              if (passwordInput === project.embedConfig.password) setIsPasswordUnlocked(true)
              else { setPasswordError(true); setTimeout(() => setPasswordError(false), 2000) }
            }}
            className="w-full mt-3 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
            style={{ minHeight: 48 }}
          >
            Unlock
          </button>
        </div>
      </div>
    )
  }

  // ── No videos yet ─────────────────────────────────────────────────────────
  if (!ready) {
    return (
      <div style={{ position: 'absolute', inset: 0 }} className="flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <p className="text-zinc-400 text-sm">Videos processing…</p>
        </div>
      </div>
    )
  }

  // ── Main player ───────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute', inset: 0,
        backgroundColor: ec.backgroundColor || '#000',
        cursor: oc.switchMode === 'hold' ? 'pointer' : 'default',
        userSelect: 'none', WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none', touchAction: 'none',
        overflow: 'hidden',
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
      {/* ── Video A — always playing, visible when showingB=false ── */}
      <video
        ref={videoARef}
        style={getVideoAStyle()}
        playsInline
        muted={ec.muted}
        loop={ec.loop}
        preload="auto"
        poster={getMuxThumbUrl(videoA.muxPlaybackId!)}
      />

      {/* ── Video B — always playing, visible when showingB=true ── */}
      <video
        ref={videoBRef}
        style={getVideoBStyle()}
        playsInline
        muted   /* starts muted; unmuted imperatively in switchToB */
        loop={ec.loop}
        preload="auto"
        poster={getMuxThumbUrl(videoB!.muxPlaybackId!)}
      />

      {/* ── Loading skeleton ── */}
      {!isLoaded && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50 }} className="bg-zinc-950 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
            <p className="text-zinc-500 text-xs">Loading…</p>
          </div>
        </div>
      )}

      {/* ── Switch flash border ── */}
      {oc.showSwitchIndicator && switchFlash && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none',
            boxShadow: `inset 0 0 0 2px ${oc.indicatorColor || '#8b5cf6'}, 0 0 24px ${oc.indicatorColor || '#8b5cf6'}50`,
            transition: 'opacity 0.15s ease',
          }}
        />
      )}

      {/* ── Hint badge ── */}
      {oc.showHint && showHint && isLoaded && !showingB && (
        <div className={`absolute z-20 pointer-events-none ${hintPositionClass[oc.hintPosition] || hintPositionClass['bottom-center']}`}>
          <div
            className="flex items-center gap-2 rounded-full text-white whitespace-nowrap"
            style={{
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: isTouchDevice ? '7px 14px' : '6px 14px',
              fontSize: isTouchDevice ? 13 : 12,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, backgroundColor: oc.indicatorColor || '#8b5cf6', animation: 'pulse 2s infinite' }} />
            {oc.hintText || (
              oc.switchMode === 'hold' ? 'Hold to reveal'
              : oc.switchMode === 'toggle' ? 'Tap to switch'
              : 'Hover to reveal'
            )}
          </div>
        </div>
      )}

      {/* ── Reality A badge ── */}
      {!showingB && oc.labelA && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 20, pointerEvents: 'none' }}>
          <div className="font-medium" style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>
            {oc.labelA}
          </div>
        </div>
      )}

      {/* ── Reality B badge ── */}
      {showingB && (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 20, pointerEvents: 'none' }}>
          <div className="font-medium" style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(34,211,238,0.3)', color: '#67e8f9', fontSize: 11 }}>
            {oc.labelB || 'Reality B'}
          </div>
        </div>
      )}

      {/* ── Controls overlay ── */}
      {(showControls || !isPlaying) && isLoaded && (
        <div
          style={{
            position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 40%)',
          }}
        >
          {/* Play button — only when paused */}
          {!isPlaying && (
            <div
              style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: oc.switchMode === 'hold' ? 'none' : 'auto',
              }}
              onClick={oc.switchMode !== 'hold' ? togglePlay : undefined}
            >
              <div style={{ width: isTouchDevice ? 60 : 52, height: isTouchDevice ? 60 : 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: 22, height: 22, color: '#fff', marginLeft: 3 }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}

          {/* Bottom bar */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isTouchDevice ? '10px 14px' : '8px 12px', pointerEvents: 'auto' }}>
            <button
              onClick={togglePlay}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44 }}
            >
              {isPlaying ? (
                <svg style={{ width: 18, height: 18 }} fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
              ) : (
                <svg style={{ width: 18, height: 18 }} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>
            {ec.allowFullscreen && (
              <button
                onClick={toggleFullscreen}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44 }}
              >
                {isFullscreen ? (
                  <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M15 9h4.5M15 9V4.5M9 15v4.5M9 15H4.5M15 15h4.5M15 15v4.5" /></svg>
                ) : (
                  <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Branding ── */}
      {oc.brandingVisible && oc.brandingText && (
        <div style={{ position: 'absolute', bottom: 6, left: 10, zIndex: 10, pointerEvents: 'none' }}>
          <a href={oc.brandingUrl || '#'} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, textDecoration: 'none', pointerEvents: 'auto' }}>
            {oc.brandingText}
          </a>
        </div>
      )}
    </div>
  )
}
