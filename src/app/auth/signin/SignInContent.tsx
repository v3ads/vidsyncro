"use client"
import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"

export default function SignInContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) router.push("/dashboard")
  }, [session, router])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signIn("google", { callbackUrl })
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <Link href="/" className="absolute top-6 left-6 text-zinc-500 hover:text-white text-sm flex items-center gap-2 transition-colors">
        ← Back to home
      </Link>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-lg shadow-violet-500/30">
            VS
          </div>
          <h1 className="font-heading text-2xl font-bold">Welcome to VidSyncro</h1>
          <p className="text-zinc-400 text-sm mt-2">Sign in to start creating dual-video experiences</p>
        </div>
        <div className="glass rounded-2xl p-8">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-white hover:bg-gray-50 text-gray-900 font-semibold transition-all hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {loading ? "Signing in..." : "Continue with Google"}
          </button>
          <p className="text-center text-zinc-600 text-xs mt-6">More sign-in options coming soon</p>
        </div>
        <p className="text-center text-zinc-600 text-xs mt-6">
          By continuing, you agree to our{" "}
          <a href="#" className="text-zinc-400 hover:text-white transition-colors underline">Terms</a>{" "}
          and{" "}
          <a href="#" className="text-zinc-400 hover:text-white transition-colors underline">Privacy Policy</a>
        </p>
      </motion.div>
    </div>
  )
}
