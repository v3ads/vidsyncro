'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRef, useState, useCallback, useEffect } from 'react'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}
const stagger = { visible: { transition: { staggerChildren: 0.12 } } }

function BeforeAfterSlider() {
  const [sliderPos, setSliderPos] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)

  const getPos = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return 50
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    return (x / rect.width) * 100
  }, [])

  const onMouseDown = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
    setSliderPos(getPos(e.clientX))
  }, [getPos])

  const onMouseMove = useCallback((e) => {
    if (!isDragging) return
    setSliderPos(getPos(e.clientX))
  }, [isDragging, getPos])

  const onMouseUp = useCallback(() => setIsDragging(false), [])

  const onTouchStart = useCallback((e) => {
    setIsDragging(true)
    setSliderPos(getPos(e.touches[0].clientX))
  }, [getPos])

  const onTouchMove = useCallback((e) => {
    if (!isDragging) return
    e.preventDefault()
    setSliderPos(getPos(e.touches[0].clientX))
  }, [isDragging, getPos])

  const onTouchEnd = useCallback(() => setIsDragging(false), [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
      return () => {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }
    }
  }, [isDragging, onMouseMove, onMouseUp])

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="bg-white/5 px-4 py-3 flex items-center gap-3 border-b border-white/10">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-gray-500 text-xs font-mono">embed.vidsyncro.com/your-project</span>
        </div>
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden select-none"
          style={{ aspectRatio: '16/9', cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img src="/day.jpg" alt="Reality B - Day" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
          <div className="absolute inset-0 overflow-hidden" style={{ width: sliderPos + '%' }}>
            <img
              src="/night.jpg"
              alt="Reality A - Night"
              className="absolute inset-0 h-full object-cover"
              style={{ width: containerRef.current?.offsetWidth + 'px' || '100%' }}
              draggable={false}
            />
          </div>
          <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: sliderPos + '%', transform: 'translateX(-50%)' }}>
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-xl flex items-center justify-center"
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7 5L3 10L7 15" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13 5L17 10L13 15" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium pointer-events-none">Reality A</div>
          <div className="absolute top-3 right-3 bg-purple-600/80 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-medium pointer-events-none">Reality B</div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-xs text-gray-200 pointer-events-none">Drag to reveal</div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { data: session } = useSession()

  // When accessed from vidframe.io, show the clean VidFrame landing
  const [isVidFrame, setIsVidFrame] = useState(false)
  useEffect(() => {
    if (window.location.hostname.includes('vidframe.io')) setIsVidFrame(true)
  }, [])

  if (isVidFrame) {
    return (
      <div style={{
        minHeight: '100vh', width: '100%', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'fixed', top: '30%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 700, height: 700,
          background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '2rem', maxWidth: 640 }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(139,92,246,0.12)',
            border: '1px solid rgba(139,92,246,0.3)',
            color: '#c4b5fd', fontSize: '0.72rem', fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '0.35rem 0.9rem', borderRadius: 9999, marginBottom: '2rem',
          }}>Private Platform</div>
          <h1 style={{
            fontSize: 'clamp(2.8rem, 8vw, 4.5rem)', fontWeight: 900,
            lineHeight: 1.05, letterSpacing: '-0.03em', margin: '0 0 1.25rem 0',
          }}>
            Two Realities.{' '}
            <span style={{
              background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>One Hold.</span>
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#a1a1aa', lineHeight: 1.7, maxWidth: 460, margin: '0 auto' }}>
            The enterprise dual-video platform. Drop two synchronized videos into
            one embed. Hold to reveal. Release to return.
          </p>
        </div>
      </div>
    )
  }

  const features = [
    { icon: '⚡', title: 'Instant Hold Switch', desc: 'Hold to peek into reality B. Release to snap back. The most intuitive dual-video UX ever built.' },
    { icon: '🎬', title: 'Mux-Powered Streaming', desc: 'Enterprise-grade video delivery via Mux. HLS adaptive bitrate, global CDN, sub-second latency.' },
    { icon: '🔄', title: 'Perfect Sync Engine', desc: 'Passive sync every 500ms ensures both videos stay frame-perfect. Switch at any moment.' },
    { icon: '🎨', title: '5 Transition Types', desc: 'Crossfade, slide, blur-reveal, zoom. Craft the exact reveal experience your audience deserves.' },
    { icon: '📊', title: 'Deep Analytics', desc: 'Track holds, durations, interactions, and viewer behavior. Know exactly what resonates.' },
    { icon: '🔒', title: 'Enterprise Security', desc: 'Domain whitelisting, password protection, embed restrictions. Your IP, locked down tight.' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">VS</div>
            <span className="font-bold text-white">VidSyncro</span>
          </div>
          <div className="flex items-center gap-3">
            {session ? (
              <Link href="/dashboard" className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/auth/signin" className="text-gray-400 hover:text-white text-sm font-medium transition-colors px-3 py-2">
                  Sign In
                </Link>
                <a href="mailto:info@vidsyncro.com" className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                  Request Access
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-28 pb-12 px-4 sm:px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 bg-purple-600/10 border border-purple-500/20 rounded-full px-4 py-1.5 text-purple-300 text-sm mb-6">
                Private Platform
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-4xl sm:text-6xl md:text-7xl font-black leading-none mb-4 tracking-tight">
              Two Realities.{' '}
              <span className="bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">
                One Hold.
              </span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              The enterprise dual-video platform. Drop two synchronized videos into one embed. Hold to reveal. Release to return.
            </motion.p>
            <motion.div variants={fadeUp} className="inline-flex flex-col items-center gap-3 mb-10">
              <div className="bg-white/5 border border-white/10 rounded-2xl px-6 sm:px-8 py-5 text-center">
                <p className="text-gray-300 text-lg mb-1">Want a project created?</p>
                <p className="text-gray-500 text-sm mb-4">VidSyncro is a private platform. Projects are created on request.</p>
                <a
                  href="mailto:info@vidsyncro.com"
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 sm:px-8 py-3 rounded-xl transition-colors text-base sm:text-lg"
                >
                  Contact info@vidsyncro.com
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* INTERACTIVE SLIDER */}
      <section className="pb-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7 }}>
          <BeforeAfterSlider />
        </motion.div>
      </section>

      {/* WATCH DEMO BUTTON */}
      <section className="pb-16 flex justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <a
            href="https://www.vidsyncro.com/app-demo-g4dsv-867174d8349c4e07"
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-white font-bold text-xl transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)',
              boxShadow: '0 0 40px rgba(168, 85, 247, 0.6), 0 0 80px rgba(168, 85, 247, 0.3), 0 4px 24px rgba(0,0,0,0.4)',
            }}
          >
            <span style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))' }}>&#9654;</span>
            Watch Demo
            <span className="absolute inset-0 rounded-2xl" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)', pointerEvents: 'none' }} />
          </a>
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="px-4 sm:px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-purple-400 text-sm font-medium uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-black">Everything you need to captivate</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-colors"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-purple-900/40 to-violet-900/20 border border-purple-500/20 rounded-3xl p-8 sm:p-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Ready to show both realities?</h2>
            <p className="text-gray-400 mb-8">VidSyncro projects are created on request. Reach out and we will set you up.</p>
            <a
              href="mailto:info@vidsyncro.com"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 sm:px-10 py-4 rounded-xl transition-colors text-lg"
            >
              Contact info@vidsyncro.com
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center text-white font-bold text-xs">VS</div>
            <span className="text-gray-500 text-sm">VidSyncro — Private Platform</span>
          </div>
          <p className="text-gray-600 text-sm">2025 VidSyncro. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
