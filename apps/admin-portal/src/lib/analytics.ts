import PostHog from 'posthog-js'

let isInitialized = false

export function initAnalytics() {
  if (typeof window === 'undefined' || isInitialized) return

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

  if (!key) return

  PostHog.init(key, { api_host: host, capture_pageview: false })
  isInitialized = true
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  PostHog.capture(event, properties)
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  PostHog.identify(userId, traits)
}

export function resetAnalytics() {
  if (typeof window === 'undefined') return
  PostHog.reset()
}
