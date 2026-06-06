// PostHog analytics — stubbed to avoid native dependency
// To enable, add posthog-react-native to package.json

let client: { capture: (e: string, p?: Record<string, unknown>) => void; identify: (id: string, t?: Record<string, unknown>) => void; reset: () => void } | null = null

export function initMobileAnalytics() {
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY
  if (!key || client || typeof window === 'undefined') return
  // PostHog disabled — add posthog-react-native package to enable
}

export function trackMobileEvent(event: string, properties?: Record<string, unknown>) {
  client?.capture(event, properties)
}

export function identifyMobileUser(userId: string, traits?: Record<string, unknown>) {
  client?.identify(userId, traits)
}

export function resetMobileAnalytics() {
  client?.reset()
}
