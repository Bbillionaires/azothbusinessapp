import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cn, formatCurrency, formatDate, formatRelativeTime, truncate } from './utils'

describe('cn — class name utility', () => {
  it('joins truthy class names with a space', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('filters out falsy values', () => {
    expect(cn('foo', undefined, null, false, 'bar')).toBe('foo bar')
  })

  it('returns empty string when all values are falsy', () => {
    expect(cn(undefined, null, false)).toBe('')
  })

  it('handles a single class', () => {
    expect(cn('only')).toBe('only')
  })
})

describe('formatCurrency', () => {
  it('formats a whole dollar amount in USD', () => {
    expect(formatCurrency(10)).toBe('$10.00')
  })

  it('formats cents correctly', () => {
    expect(formatCurrency(9.99)).toBe('$9.99')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats large amounts with comma separators', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
  })
})

describe('formatDate', () => {
  it('formats a date string into readable form', () => {
    const result = formatDate('2024-01-15')
    expect(result).toMatch(/Jan/)
    expect(result).toMatch(/15/)
    expect(result).toMatch(/2024/)
  })

  it('accepts a Date object', () => {
    const result = formatDate(new Date('2024-06-01'))
    expect(result).toMatch(/Jun/)
    expect(result).toMatch(/2024/)
  })
})

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "just now" for a date less than 1 minute ago', () => {
    const recent = new Date('2024-01-15T11:59:30Z').toISOString()
    expect(formatRelativeTime(recent)).toBe('just now')
  })

  it('returns minutes ago for dates within the last hour', () => {
    const thirtyMinsAgo = new Date('2024-01-15T11:30:00Z').toISOString()
    expect(formatRelativeTime(thirtyMinsAgo)).toBe('30m ago')
  })

  it('returns hours ago for dates within the last day', () => {
    const threeHoursAgo = new Date('2024-01-15T09:00:00Z').toISOString()
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago')
  })

  it('returns days ago for dates within the last week', () => {
    const threeDaysAgo = new Date('2024-01-12T12:00:00Z').toISOString()
    expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago')
  })

  it('returns a formatted date for dates older than a week', () => {
    const twoWeeksAgo = new Date('2024-01-01T12:00:00Z').toISOString()
    const result = formatRelativeTime(twoWeeksAgo)
    expect(result).toMatch(/Jan/)
    expect(result).toMatch(/2024/)
  })
})

describe('truncate', () => {
  it('returns the string unchanged if at or under maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello')
    expect(truncate('hello', 5)).toBe('hello')
  })

  it('truncates and appends ellipsis when string exceeds maxLength', () => {
    expect(truncate('hello world', 8)).toBe('hello...')
  })

  it('handles empty string', () => {
    expect(truncate('', 5)).toBe('')
  })

  it('truncated string is exactly maxLength characters', () => {
    const result = truncate('abcdefghij', 7)
    expect(result).toHaveLength(7)
    expect(result).toBe('abcd...')
  })
})
