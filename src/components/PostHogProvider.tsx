'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

// Initialize PostHog once on the client
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.debug()
    },
  })
}

function PostHogIdentify() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.user?.email) {
      posthog.identify(session.user.id || session.user.email, {
        email: session.user.email,
        name: session.user.name,
        plan: (session.user as { plan?: string }).plan,
      })
    } else {
      posthog.reset()
    }
  }, [session])

  return null
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return <>{children}</>
  return (
    <PHProvider client={posthog}>
      <PostHogIdentify />
      {children}
    </PHProvider>
  )
}
