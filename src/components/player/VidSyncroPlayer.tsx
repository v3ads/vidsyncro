'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Project } from '@/types'
import Hls from 'hls.js'

function attachHls(
  videoEl: HTMLVideoElement,
  src: string,
  onReady: () => void,
): Hls | null {
  if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
    videoEl.src = src
    videoEl.addEventListener('canplay', onReady, { once: true })
    return null
  } else if (Hls.isSupported()) {
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
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

function getMuxHlsUrl(playbackId: string) { return `https://stream.mux.com/${playbackId}.m3u8` }
function getMuxThumbUrl(playbackId: string, time = 0) { return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}&width=1280` }

interface VidSyncroPlayerProps {
  project: Project
  onAnalyticsEvent?: (type: string, data: Record<string, unknown>) => void
  preview?: boolean
}

export default function VidSyncroPlayer({ project, onAnalyticsEvent, preview = false }: VidSyncroPlayerProps) {
  const videoARef = useRef<HTMLVideoElement>(null)
  const videoBRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hlsARef = useRef<Hls | null>(null)
  const hlsBRef = useRef<Hls | null>(null)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pointerDownTimeRef = useRef(0)
  const holdStartRef = useRef<number | null>(null)
  const autoSwitchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionIdRef = useRef(Math.random().toString(36).slice(2))
  const viewTrackedRef = useRef(false)

  const [showingB, setShowingB] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [loadedA, setLoadedA] = useState(false)
  const [loadedB, setLoadedB] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const [switchFlash, setSwitchFlash] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(!project.embedConfig.passwordProtected)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)

  const isLoaded = loadedA && loadedB
  const { overlayConfig: oc, embedConfig: ec } = project
  const videoA = project.videoA
  const videoB = project.videoB
  const ready = !!videoA?.muxPlaybackId && !!videoB?.muxPlaybackId
  const showingA = !showingB

  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(hover: none) and (pointer: coarse)').matches)
  }, [])

  const trackEvent = useCallback((type: string, data: Record<string, unknown> = {}) => {
    if (preview) return
    const payload = { projectId: project.id, sessionId: sessionIdRef.current, event_type: type, metadata: data }
    onAnalyticsEvent?.(type, payload)
    fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true }).catch(() => {})
  }, [project.id, preview, onAnalyticsEvent])

  useEffect(() => {
    if (!viewTrackedRef.current && isPasswordUnlocked) { viewTrackedRef.current = true; trackEvent('view') }
  }, [isPasswordUnlocked, trackEvent])

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

  // Autoplay: both start muted (mobile browser policy).
  // Unmute button on Video A lets user restore sound in one tap.
  useEffect(() => {
    if (!isLoaded) return
    const a = videoARef.current
    const b = videoBRef.current
    if (!a || !b) return
    if (ec.autoplay) {
      a.muted = true
      b.muted = true
      Promise.all([a.play().catch(() => {}), b.play().catch(() => {})]).then(() => {
        setIsPlaying(true)
        setIsMuted(true)
      })
    }
    if (isTouchDevice) {
      setShowControls(true)
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded])

  // One-tap unmute. Always on Video A (button never shown during B).
  // After unmute, switchToA/B carry sound to whichever video is visible.
  const handleUnmute = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const a = videoARef.current
    const b = videoBRef.current
    if (!a || !b) return
    a.muted = false
    b.muted = true
    setIsMuted(false)
  }, [])

  const playBoth = useCallback(() => {
    const a = videoARef.current
    const b = videoBRef.current
    if (!a || !b) return
    Promise.all([a.play().catch(() => {}), b.play().catch(() => {})]).then(() => setIsPlaying(true))
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
    if (isPlaying) pauseBoth(); else playBoth()
  }, [isPlaying, playBoth, pauseBoth])

  // Switch: audio follows the visible video once unmuted
  const switchToB = useCallback(() => {
    const a = videoARef.current
    const b = videoBRef.current
    if (!a || !b) return
    b.currentTime = a.currentTime
    if (!isMuted) { a.muted = true; b.muted = false }
    setShowingB(true)
    setSwitchFlash(true)
    setTimeout(() => setSwitchFlash(false), 300)
    holdStartRef.current = Date.now()
    if (oc.showHint) setShowHint(false)
    trackEvent('hold_start', { currentTime: a.currentTime })
  }, [oc.showHint, isMuted, trackEvent])

  const switchToA = useCallback(() => {
    const a = videoARef.current
    const b = videoBRef.current
    if (!a || !b) return
    a.currentTime = b.currentTime
    if (!isMuted) { b.muted = true; a.muted = false }
    setShowingB(false)
    if (holdStartRef.current) {
      const duration = (Date.now() - holdStartRef.current) / 1000
      trackEvent('hold_end', { duration, currentTime: b.currentTime })
      holdStartRef.current = null
    }
  }, [isMuted, trackEvent])

  useEffect(() => {
    if (!oc.autoSwitchEnabled || !isPlaying) return
    autoSwitchIntervalRef.current = setInterval(() => setShowingB(prev => !prev), (oc.autoSwitchInterval || 5) * 1000)
    return () => { if (autoSwitchIntervalRef.current) clearInterval(autoSwitchIntervalRef.current) }
  }, [oc.autoSwitchEnabled, oc.autoSwitchInterval, isPlaying])

  const HOLD_THRESHOLD = 200

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    if (oc.switchMode === 'hold') {
      pointerDownTimeRef.current = Date.now()
      holdTimerRef.current = setTimeout(() => switchToB(), HOLD_THRESHOLD)
    } else if (oc.switchMode === 'toggle') {
      if (showingB) switchToA(); else switchToB()
    }
  }, [oc.switchMode, showingB, switchToA, switchToB])

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

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (oc.switchMode === 'hover' && e.buttons === 0) switchToB()
  }, [oc.switchMode, switchToB])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'BUTTON') return
    if (oc.switchMode === 'hold') {
      pointerDownTimeRef.current = Date.now()
      holdTimerRef.current = setTimeout(() => {
        switchToB()
        if ('vibrate' in navigator) navigator.vibrate(30)
      }, HOLD_THRESHOLD)
    } else if (oc.switchMode === 'toggle') {
      if (showingB) switchToA(); else switchToB()
    }
  }, [oc.switchMode, showingB, switchToA, switchToB])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'BUTTON') return
    if (oc.switchMode === 'hold') {
      if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null }
      const elapsed = Date.now() - pointerDownTimeRef.current
      if (elapsed < HOLD_THRESHOLD) togglePlay(); else switchToA()
    }
  }, [oc.switchMode, switchToA, togglePlay])

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

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500)
  }, [])

  const transitionStyle: React.CSSProperties = {
    transition: `opacity ${oc.transitionDuration}ms ease, transform ${oc.transitionDuration}ms ease, filter ${oc.transitionDuration}ms ease`,
  }

  const getVideoAStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { ...transitionStyle, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
    if (oc.transitionType === 'crossfade') return { ...base, opacity: showingB ? 0 : 1, zIndex: showingB ? 1 : 2 }
    if (oc.transitionType === 'slide-left') return { ...base, transform: showingB ? 'translateX(-100%)' : 'translateX(0)', zIndex: showingB ? 1 : 2 }
    if (oc.transitionType === 'slide-right') return { ...base, transform: showingB ? 'translateX(100%)' : 'translateX(0)', zIndex: showingB ? 1 : 2 }
    if (oc.transitionType === 'zoom') return { ...base, opacity: showingB ? 0 : 1, transform: showingB ? 'scale(1.08)' : 'scale(1)', zIndex: showingB ? 1 : 2 }
    if (oc.transitionType === 'blur-reveal') return { ...base, opacity: showingB ? 0 : 1, filter: showingB ? 'blur(12px)' : 'blur(0px)', zIndex: showingB ? 1 : 2 }
    return { ...base, opacity: showingB ? 0 : 1, zIndex: 2 }
  }

  const getVideoBStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { ...transitionStyle, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }
    if (oc.transitionType === 'crossfade') return { ...base, opacity: showingB ? 1 : 0, zIndex: showingB ? 2 : 1 }
    if (oc.transitionType === 'slide-left') return { ...base, transform: showingB ? 'translateX(0)' : 'translateX(100%)', zIndex: showingB ? 2 : 1 }
    if (oc.transitionType === 'slide-right') return { ...base, transform: showingB ? 'translateX(0)' : 'translateX(-100%)', zIndex: showingB ? 2 : 1 }
    if (oc.transitionType === 'zoom') return { ...base, opacity: showingB ? 1 : 0, transform: showingB ? 'scale(1)' : 'scale(0.95)', zIndex: showingB ? 2 : 1 }
    if (oc.transitionType === 'blur-reveal') return { ...base, opacity: showingB ? 1 : 0, filter: showingB ? 'blur(0px)' : 'blur(8px)', zIndex: showingB ? 2 : 1 }
    return { ...base, opacity: showingB ? 1 : 0, zIndex: 1 }
  }

  const hintPositionClass: Record<string, string> = {
    'bottom-center': 'bottom-3 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-3 left-3',
    'bottom-right': 'bottom-3 right-3',
    'top-center': 'top-3 left-1/2 -translate-x-1/2',
  }

  if (!isPasswordUnlocked) {
    return (
      <div className="relative w-full h-full bg-zinc-950 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="text-4xl mb-2">🔒</div>
          <h3 className="text-white font-semibold text-lg">Password Required</h3>
          <p className="text-zinc-400 text-sm">Enter the password to view this video</p>
          <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                if (passwordInput === project.embedConfig.password) setIsPasswordUnlocked(true)
                else { setPasswordError(true); setTimeout(() => setPasswordError(false), 2000) }
              }
            }}
            placeholder="Enter password" style={{ fontSize: 16 }}
            className={`w-full px-3 py-3 rounded-xl bg-zinc-800 border ${passwordError ? 'border-red-500' : 'border-white/10'} text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors`}
          />
          {passwordError && <p className="text-red-400 text-sm">Incorrect password</p>}
          <button onClick={() => {
            if (passwordInput === project.embedConfig.password) setIsPasswordUnlocked(true)
            else { setPasswordError(true); setTimeout(() => setPasswordError(false), 2000) }
          }} className="w-full mt-3 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors" style={{ minHeight: 48 }}>
            Unlock
          </button>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="relative w-full h-full bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Videos processing…</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black overflow-hidden select-none"
      style={{ cursor: 'pointer' }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onMouseMove={showControlsTemporarily}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Video A — muted attr required for mobile autoplay */}
      <video ref={videoARef} style={getVideoAStyle()} playsInline muted loop={ec.loop} preload="auto" poster={getMuxThumbUrl(videoA!.muxPlaybackId!, 0)} />
      {/* Video B — always starts muted */}
      <video ref={videoBRef} style={getVideoBStyle()} playsInline muted loop={ec.loop} preload="auto" poster={getMuxThumbUrl(videoB!.muxPlaybackId!, 0)} />

      {/* Loading skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center gap-3 z-20">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 text-sm font-medium">Loading…</p>
        </div>
      )}

      {/* ── ALL OVERLAYS BELOW: VIDEO A ONLY (showingA) ───────────────────── */}

      {/* Unmute button — bottom-left, icon-only, one tap, gone after */}
      {showingA && isLoaded && isPlaying && isMuted && !ec.muted && (
        <button
          onPointerDown={e => { e.stopPropagation(); handleUnmute(e as any) }}
          className="absolute bottom-12 left-3 z-40 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{ width: 44, height: 44, background: 'rgba(124,58,237,0.88)', backdropFilter: 'blur(8px)', boxShadow: '0 0 18px rgba(124,58,237,0.7), 0 2px 8px rgba(0,0,0,0.5)', border: '1.5px solid rgba(255,255,255,0.25)' }}
          aria-label="Unmute"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        </button>
      )}

      {/* Switch flash — A only */}
      {showingA && oc.showSwitchIndicator && switchFlash && (
        <div className="absolute inset-0 z-20 pointer-events-none rounded-sm" style={{ boxShadow: `inset 0 0 0 3px ${oc.indicatorColor || '#8b5cf6'}` }} />
      )}

      {/* Hint badge — A only */}
      {showingA && oc.showHint && showHint && isLoaded && (
        <div className={`absolute z-10 pointer-events-none ${hintPositionClass[oc.hintPosition || 'bottom-center'] || hintPositionClass['bottom-center']}`}>
          <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium">
            {oc.hintText || (oc.switchMode === 'hold' ? 'Hold to reveal' : oc.switchMode === 'toggle' ? 'Tap to switch' : 'Hover to reveal')}
          </span>
        </div>
      )}

      {/* Reality A label — A only */}
      {showingA && oc.labelA && (
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span className="bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium">{oc.labelA}</span>
        </div>
      )}

      {/* Reality B label — B only */}
      {showingB && (
        <div className="absolute top-3 left-3 z-10 pointer-events-none">
          <span
            className="text-white text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: oc.indicatorColor || '#8b5cf6' }}
          >
            {oc.labelB || 'Reality B'}
          </span>
        </div>
      )}

      {/* Controls overlay — A only */}
      {showingA && (showControls || !isPlaying) && isLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col justify-end pointer-events-none">
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              <button onClick={e => { e.stopPropagation(); playBoth() }} className="w-16 h-16 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center hover:bg-black/80 transition-colors">
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current ml-1"><path d="M8 5v14l11-7z" /></svg>
              </button>
            </div>
          )}
          <div className="flex items-center justify-between px-3 py-2 pointer-events-auto" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
            <button onClick={e => { e.stopPropagation(); togglePlay() }} className="text-white p-1 hover:text-violet-300 transition-colors">
              {isPlaying
                ? <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                : <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M8 5v14l11-7z" /></svg>}
            </button>
            {ec.allowFullscreen && (
              <button onClick={e => { e.stopPropagation(); toggleFullscreen() }} className="text-white p-1 hover:text-violet-300 transition-colors">
                {isFullscreen
                  ? <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" /></svg>
                  : <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Branding — A only */}
      {showingA && oc.brandingVisible && oc.brandingText && (
        <div className="absolute bottom-2 right-2 z-10 pointer-events-auto">
          <a href={oc.brandingUrl} target="_blank" rel="noopener noreferrer" className="text-white/50 text-xs hover:text-white/80 transition-colors" onClick={e => e.stopPropagation()}>
            {oc.brandingText}
          </a>
        </div>
      )}
    </div>
  )
}
