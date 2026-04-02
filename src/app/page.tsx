'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
}

export default function LandingPage() {
  const { data: session } = useSession()

  const features = [
    { icon: '⚡', title: 'Instant Hold Switch', desc: 'Hold to peek into reality B. Release to snap back. The most intuitive dual-video UX ever built.' },
    { icon: '🎬', title: 'Mux-Powered Streaming', desc: 'Enterprise-grade video delivery via Mux. HLS adaptive bitrate, global CDN, sub-second latency.' },
    { icon: '🔄', title: 'Perfect Sync Engine', desc: 'Passive sync every 500ms ensures both videos stay frame-perfect. Switch at any moment.' },
    { icon: '🎨', title: '5 Transition Types', desc: 'Crossfade, slide, blur-reveal, zoom — craft the exact reveal experience your audience deserves.' },
    { icon: '📊', title: 'Deep Analytics', desc: 'Track holds, durations, interactions, and viewer behavior. Know exactly what resonates.' },
    { icon: '🔒', title: 'Enterprise Security', desc: 'Domain whitelisting, password protection, embed restrictions. Your IP, locked down tight.' },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
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
      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp}>
              <span className="inline-flex items-center gap-2 bg-purple-600/10 border border-purple-500/20 rounded-full px-4 py-1.5 text-purple-300 text-sm mb-8">
                Private Platform
              </span>
            </motion.div>
            <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl font-black leading-none mb-6 tracking-tight">
              Two Realities.{' '}
              <span className="bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent">
                One Hold.
              </span>
            </motion.h1>
            <motion.p variants={fadeUp} className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              The enterprise dual-video platform. Drop two synchronized videos into one embed. Hold to reveal. Release to return.
            </motion.p>
            <motion.div variants={fadeUp}>
              <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-center inline-block">
                <p className="text-gray-300 text-lg mb-1">Want a project created?</p>
                <p className="text-gray-500 text-sm mb-5">VidSyncro is a private platform. Projects are created on request.</p>
                <a
                  href="mailto:info@vidsyncro.com"
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-lg"
                >
                  Contact info@vidsyncro.com
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* MOCKUP */}
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="bg-white/5 px-4 py-3 flex items-center gap-3 border-b border-white/10">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <span className="text-gray-500 text-xs font-mono">embed.vidsyncro.com/your-project</span>
            </div>
            <div className="relative aspect-video bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-violet-900/20" />
              <div className="relative text-center">
                <div className="text-4xl mb-3">&#9654;</div>
                <p className="text-gray-400 text-sm">Hold to reveal Reality B</p>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-xs text-gray-300">
                Hold to reveal
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-purple-400 text-sm font-medium uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl font-black">Everything you need to captivate</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
      <section className="px-6 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-purple-900/40 to-violet-900/20 border border-purple-500/20 rounded-3xl p-12">
            <h2 className="text-4xl font-black mb-4">Ready to show both realities?</h2>
            <p className="text-gray-400 mb-8">VidSyncro projects are created on request. Reach out and we will set you up.</p>
            <a
              href="mailto:info@vidsyncro.com"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-10 py-4 rounded-xl transition-colors text-lg"
            >
              Contact info@vidsyncro.com
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
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
