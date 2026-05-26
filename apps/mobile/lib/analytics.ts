// PostHog mobile analytics
// @ts-ignore — package installed via app.json
import PostHog from 'posthog-react-native'

let client: PostHog | null = null

export function initMobileAnalytics() {
  const key = process.env.EXPO_PUBLIC_POSTHOG_KEY
  if (!key || client) return
  client = new PostHog(key, { host: 'https://app.posthog.com' })
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
