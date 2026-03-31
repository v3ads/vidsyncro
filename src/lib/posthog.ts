/**
 * PostHog product analytics
 * Server-side: node client for backend events
 * Client-side: Provider wraps the app with posthog-js
 *
 * Env vars: NEXT_PUBLIC_POSTHOG_KEY, NEXT_PUBLIC_POSTHOG_HOST
 */

// ── Server-side (Node) ───────────────────────────────────────────────────────
// Used in API routes and webhook handlers for backend event capture

const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || ''

interface PostHogEvent {
  distinctId: string
  event: string
  properties?: Record<string, unknown>
}

export async function captureEvent(opts: PostHogEvent): Promise<void> {
  if (!POSTHOG_KEY) return
  try {
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event: opts.event,
        distinct_id: opts.distinctId,
        properties: {
          ...opts.properties,
          $lib: 'vidsyncro-server',
        },
        timestamp: new Date().toISOString(),
      }),
    })
  } catch {
    // Non-fatal — analytics failures never block the main flow
  }
}

export async function identifyUser(
  distinctId: string,
  properties: Record<string, unknown>
): Promise<void> {
  if (!POSTHOG_KEY) return
  try {
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event: '$identify',
        distinct_id: distinctId,
        $set: properties,
        timestamp: new Date().toISOString(),
      }),
    })
  } catch {}
}

// ── Convenience wrappers ─────────────────────────────────────────────────────

export const posthog = {
  planUpgraded: (userId: string, plan: string) =>
    captureEvent({ distinctId: userId, event: 'plan_upgraded', properties: { plan } }),

  projectCreated: (userId: string, projectId: string) =>
    captureEvent({ distinctId: userId, event: 'project_created', properties: { projectId } }),

  projectPublished: (userId: string, projectId: string) =>
    captureEvent({ distinctId: userId, event: 'project_published', properties: { projectId } }),

  videoUploaded: (userId: string, projectId: string, slot: 'a' | 'b') =>
    captureEvent({ distinctId: userId, event: 'video_uploaded', properties: { projectId, slot } }),

  embedViewed: (projectId: string, sessionId: string) =>
    captureEvent({ distinctId: sessionId, event: 'embed_viewed', properties: { projectId } }),
}
