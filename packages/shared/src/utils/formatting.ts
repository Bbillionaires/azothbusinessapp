// =============================================================================
// @local-first-rewards/shared — Formatting Utilities
// =============================================================================

/**
 * Format a numeric amount as USD currency.
 * Examples: 1234.5 → "$1,234.50"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a date string or Date object as a readable date.
 * Examples: "2024-03-15T12:00:00Z" → "Mar 15, 2024"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d)
}

/**
 * Format a date as a relative time string.
 * Examples: "just now", "5 minutes ago", "2 hours ago", "3 days ago", "Mar 15, 2024"
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = Date.now()
  const diffMs = now - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`

  // Fall back to formatted date for older timestamps
  return formatDate(d)
}

/**
 * Format a points value with abbreviation for large numbers.
 * Examples: 999 → "999 pts", 1234 → "1,234 pts", 12345 → "12.3K pts", 1234567 → "1.2M pts"
 */
export function formatPoints(points: number): string {
  if (points >= 1_000_000) {
    const val = points / 1_000_000
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M pts`
  }
  if (points >= 10_000) {
    const val = points / 1_000
    return `${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K pts`
  }
  return `${points.toLocaleString('en-US')} pts`
}

/**
 * Format a distance in miles.
 * Examples: 0.3 → "0.3 mi", 2.15 → "2.1 mi", 15.0 → "15.0 mi"
 */
export function formatDistance(miles: number): string {
  if (miles < 10) {
    return `${miles.toFixed(1)} mi`
  }
  return `${Math.round(miles)} mi`
}

/**
 * Mask a full name to first name + last initial.
 * Examples: "John Doe" → "John D.", "Alice" → "Alice", "Mary Jane Watson" → "Mary W."
 */
export function maskName(fullName: string): string {
  if (!fullName || !fullName.trim()) return ''
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const firstName = parts[0]
  const lastInitial = parts[parts.length - 1][0].toUpperCase()
  return `${firstName} ${lastInitial}.`
}

/**
 * Generate initials from a name (up to 2 characters).
 * Examples: "John Doe" → "JD", "Alice" → "A", "Mary Jane Watson" → "MW"
 */
export function generateInitials(name: string): string {
  if (!name || !name.trim()) return ''
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0][0].toUpperCase()
  // First initial + last initial
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
