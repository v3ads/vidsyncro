'use client'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import { motion } from 'framer-motion'

const planDetails: Record<string, { label: string; color: string; description: string; features: string[] }> = {
  free: {
    label: 'Free',
    color: 'bg-zinc-700/50 text-zinc-300 border-zinc-600',
    description: 'Get started with the basics.',
    features: ['Up to 3 projects', '100 views/month', 'Basic analytics', 'VidSyncro branding'],
  },
  starter: {
    label: 'Starter',
    color: 'bg-blue-600/20 text-blue-300 border-blue-500/40',
    description: 'Perfect for creators getting started.',
    features: ['Up to 10 projects', '1,000 views/month', 'Full analytics', 'Remove branding'],
  },
  pro: {
    label: 'Pro',
    color: 'bg-violet-600/20 text-violet-300 border-violet-500/40',
    description: 'For professional creators and teams.',
    features: ['Unlimited projects', '50,000 views/month', 'Advanced analytics', 'Priority support'],
  },
  enterprise: {
    label: 'Enterprise',
    color: 'bg-cyan-600/20 text-cyan-300 border-cyan-500/40',
    description: 'Custom solutions for large teams.',
    features: ['Unlimited everything', 'Custom SLA', 'Dedicated support', 'Custom integrations'],
  },
  admin: {
    label: 'Admin',
    color: 'bg-gradient-to-r from-violet-600/30 to-cyan-500/30 text-white border-violet-500/40',
    description: 'Full platform access.',
    features: ['All features unlocked', 'Admin dashboard', 'User management', 'Platform controls'],
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const plan = session?.user?.plan || 'free'
  const planInfo = planDetails[plan] || planDetails.free

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp}>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-zinc-500 text-sm mt-1">Manage your account and subscription.</p>
      </motion.div>

      {/* Account Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { duration: 0.4, delay: 0.1 } } }}
        className="bg-[#111111] border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Account</h2>
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-violet-600 flex-shrink-0">
            {session?.user?.image ? (
              <Image src={session.user.image} alt="Avatar" fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-xl font-bold">
                {session?.user?.name?.[0] || '?'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-lg truncate">{session?.user?.name || 'Unknown'}</p>
            <p className="text-zinc-500 text-sm truncate">{session?.user?.email}</p>
            <p className="text-zinc-600 text-xs mt-0.5">Signed in with Google</p>
          </div>
        </div>
      </motion.div>

      {/* Plan Card */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { duration: 0.4, delay: 0.2 } } }}
        className="bg-[#111111] border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">Subscription</h2>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${planInfo.color} mb-2`}>
              {planInfo.label}
            </div>
            <p className="text-zinc-400 text-sm">{planInfo.description}</p>
          </div>
        </div>
        <ul className="mt-4 space-y-2">
          {planInfo.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
              <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
        {plan === 'free' && (
          <div className="mt-5 pt-5 border-t border-white/5">
            <p className="text-zinc-500 text-sm mb-3">Upgrade to unlock more projects, views, and features.</p>
            <a
              href="mailto:vipaymanshalaby@gmail.com?subject=VidSyncro Upgrade"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Upgrade Plan
            </a>
          </div>
        )}
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ ...fadeUp, visible: { ...fadeUp.visible, transition: { duration: 0.4, delay: 0.3 } } }}
        className="bg-[#111111] border border-red-500/20 rounded-2xl p-6"
      >
        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4">Session</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">Sign out</p>
            <p className="text-zinc-500 text-xs mt-0.5">You will be redirected to the home page.</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 text-sm font-semibold border border-red-500/30 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </motion.div>
    </div>
  )
}
