'use client'

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
}

export default function LandingPage() {
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -200])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 200])

  const features = [
    {
      icon: '⚡',
      title: 'Instant Hold Switch',
      desc: 'Hold to peek into reality B. Release to snap back. The most intuitive dual-video UX ever built.',
    },
    {
      icon: '🎬',
      title: 'Mux-Powered Streaming',
      desc: 'Enterprise-grade video delivery via Mux. HLS adaptive bitrate, global CDN, sub-second latency.',
    },
    {
      icon: '🔄',
      title: 'Perfect Sync Engine',
      desc: 'Passive sync every 500ms ensures both videos stay frame-perfect. Switch at any moment.',
    },
    {
      icon: '🎨',
      title: '5 Transition Types',
      desc: 'Crossfade, slide, blur-reveal, zoom — craft the exact reveal experience your audience deserves.',
    },
    {
      icon: '📊',
      title: 'Deep Analytics',
      desc: 'Track holds, durations, interactions, and viewer behavior. Know exactly what resonates.',
    },
    {
      icon: '🔒',
      title: 'Enterprise Security',
      desc: 'Domain whitelisting, password protection, embed restrictions. Your IP, locked down tight.',
    },
  ]

  const steps = [
    {
      num: '01',
      title: 'Upload Two Videos',
      desc: 'Upload Reality A and Reality B directly to Mux via our drag-and-drop interface.',
      icon: '📤',
    },
    {
      num: '02',
      title: 'Configure the Experience',
      desc: 'Choose your transition style, hint text, branding, and interaction mode.',
      icon: '⚙️',
    },
    {
      num: '03',
      title: 'Embed Anywhere',
      desc: 'Copy one line of embed code. Drop it anywhere on the web. Done.',
      icon: '🚀',
    },
  ]

  const pricingTiers = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      desc: 'Try the magic',
      features: ['2 projects', 'Basic transitions', 'VidSyncro branding', 'Public embeds'],
      cta: 'Start Free',
      highlight: false,
    },
    {
      name: 'Starter',
      price: '$29',
      period: '/month',
      desc: 'For creators & freelancers',
      features: [
        '20 projects',
        'All transitions',
        'Custom branding',
        'Analytics dashboard',
        'Password protection',
      ],
      cta: 'Get Starter',
      highlight: false,
    },
    {
      name: 'Pro',
      price: '$79',
      period: '/month',
      desc: 'For growing teams',
      features: [
        'Unlimited projects',
        'Domain whitelist',
        'Priority support',
        'Advanced analytics',
        'Custom player colors',
        'API access',
      ],
      cta: 'Get Pro',
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      desc: 'For large organizations',
      features: [
        'Everything in Pro',
        'SSO / SAML',
        'SLA guarantee',
        'Dedicated support',
        'Custom contracts',
        'On-prem option',
      ],
      cta: 'Contact Sales',
      highlight: false,
    },
  ]

  const logos = ['Acme Corp', 'TechFlow', 'Visionary', 'Nexus Media', 'Catalyst', 'Apex Studio']

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-sm font-bold">
            VS
          </div>
          <span className="font-heading font-bold text-lg tracking-tight">VidSyncro</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm text-zinc-400 hover:text-white transition-colors">
            How it Works
          </a>
          <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Features
          </a>
          <a href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Pricing
          </a>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors"
            >
              Dashboard →
            </Link>
          ) : (
            <Link
              href="/auth/signin"
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 overflow-hidden"
      >
        {/* Animated blobs */}
        <motion.div
          style={{ y: y1 }}
          className="absolute top-20 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          style={{ y: y2 }}
          className="absolute bottom-20 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"
          animate={{
            scale: [1, 1.15, 1],
            x: [0, -25, 0],
            y: [0, 25, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
            Now in public beta — free to start
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-heading text-6xl md:text-8xl font-bold leading-[1.05] tracking-tight mb-6"
          >
            Two Realities.
            <br />
            <span className="gradient-text">One Hold.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-10"
          >
            The enterprise dual-video platform. Drop two synchronized videos into one embed.
            Hold to reveal. Release to return. The future of interactive media.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/auth/signin"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-semibold text-lg transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-105"
            >
              Start Free →
            </Link>
            <a
              href="#how-it-works"
              className="px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-lg transition-all"
            >
              See How It Works
            </a>
          </motion.div>

          {/* Animated mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 relative max-w-3xl mx-auto"
          >
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-violet-500/20 bg-black">
              {/* Fake player chrome */}
              <div className="bg-zinc-900 px-4 py-3 flex items-center gap-2 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 text-center text-xs text-zinc-500 font-mono">
                  embed.vidsyncro.com/demo-project
                </div>
              </div>

              {/* Mock player */}
              <div className="relative aspect-video bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
                {/* Video A mock */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 to-black" />
                {/* Video B partially showing */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-cyan-900/30 to-black"
                  animate={{ opacity: [0, 0.8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                />

                {/* Center content */}
                <div className="relative z-10 text-center">
                  <motion.div
                    className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-3 mx-auto backdrop-blur-sm border border-white/20"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </motion.div>
                  <p className="text-zinc-400 text-sm">Hold to reveal Reality B</p>
                </div>

                {/* Hint badge */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                  <motion.div
                    className="px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-violet-500/30 text-sm text-violet-300 flex items-center gap-2"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                    Hold to reveal
                  </motion.div>
                </div>

                {/* Switch indicator */}
                <motion.div
                  className="absolute inset-0 rounded-lg border-2 border-violet-500 pointer-events-none"
                  animate={{ opacity: [0, 0.6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 2 }}
                />
              </div>
            </div>

            {/* Glow under mockup */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-violet-600/20 blur-3xl rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-violet-400 font-medium mb-4 tracking-widest text-sm uppercase">
              How it works
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-heading text-4xl md:text-5xl font-bold">
              Up and running in{' '}
              <span className="gradient-text">3 steps</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {steps.map((step, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="relative glass rounded-2xl p-8 group hover:border-violet-500/30 transition-colors"
              >
                <div className="text-4xl mb-4">{step.icon}</div>
                <div className="text-violet-500 font-mono text-sm font-bold mb-2">{step.num}</div>
                <h3 className="font-heading text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-violet-500/50 to-transparent" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-32 px-6 bg-gradient-to-b from-transparent via-violet-950/5 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-cyan-400 font-medium mb-4 tracking-widest text-sm uppercase">
              Features
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-heading text-4xl md:text-5xl font-bold">
              Everything you need to{' '}
              <span className="gradient-text">captivate</span>
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                whileHover={{ y: -4, scale: 1.01 }}
                className="glass rounded-2xl p-6 group cursor-default"
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform inline-block">
                  {feature.icon}
                </div>
                <h3 className="font-heading text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} className="text-violet-400 font-medium mb-4 tracking-widest text-sm uppercase">
              Pricing
            </motion.p>
            <motion.h2 variants={fadeUp} className="font-heading text-4xl md:text-5xl font-bold">
              Simple, honest{' '}
              <span className="gradient-text">pricing</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-zinc-400 mt-4 max-w-xl mx-auto">
              Start free. Upgrade when you need more. No surprises.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {pricingTiers.map((tier, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className={`rounded-2xl p-6 flex flex-col relative ${
                  tier.highlight
                    ? 'bg-gradient-to-b from-violet-900/40 to-violet-950/20 border-2 border-violet-500/50 shadow-lg shadow-violet-500/20'
                    : 'glass'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-violet-500 text-white text-xs font-bold">
                    Most Popular
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-heading text-lg font-bold mb-1">{tier.name}</h3>
                  <p className="text-zinc-500 text-sm mb-4">{tier.desc}</p>
                  <div className="flex items-end gap-1">
                    <span className="font-heading text-4xl font-bold">{tier.price}</span>
                    {tier.period && (
                      <span className="text-zinc-400 text-sm mb-1.5">{tier.period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {tier.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2 text-sm">
                      <span className="text-violet-400 mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-zinc-300">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/signin"
                  className={`w-full py-3 rounded-xl text-sm font-semibold text-center transition-all ${
                    tier.highlight
                      ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                  }`}
                >
                  {tier.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="py-20 px-6 border-y border-white/5 overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-zinc-600 text-sm uppercase tracking-widest mb-10">
            Trusted by creators and enterprises worldwide
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap">
            {logos.map((logo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-zinc-600 font-heading font-bold text-lg tracking-tight hover:text-zinc-400 transition-colors cursor-default"
              >
                {logo}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-gradient-radial from-violet-600/20 via-transparent to-transparent blur-3xl" />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="relative z-10"
          >
            <motion.h2
              variants={fadeUp}
              className="font-heading text-5xl md:text-6xl font-bold mb-6"
            >
              Ready to show both{' '}
              <span className="gradient-text">realities?</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-zinc-400 mb-10">
              Join thousands of creators who've upgraded to interactive dual-video. Free to start.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Link
                href="/auth/signin"
                className="inline-block px-10 py-5 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-bold text-xl transition-all shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105"
              >
                Start Free Today →
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-xs font-bold">
              VS
            </div>
            <span className="font-heading font-bold">VidSyncro</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
          </div>
          <p className="text-zinc-600 text-sm">
            © {new Date().getFullYear()} VidSyncro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
