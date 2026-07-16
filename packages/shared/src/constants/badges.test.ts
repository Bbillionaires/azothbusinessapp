import { describe, it, expect } from 'vitest'
import { BADGE_DEFINITIONS, getBadgeDefinition, getBadgesByCategory } from './badges.js'

const VALID_TIERS = new Set(['bronze', 'silver', 'gold', 'platinum', 'legend'])
const VALID_CATEGORIES = new Set([
  'spending', 'community', 'referral', 'review', 'event', 'milestone', 'tier', 'ownership',
])

const allBadges = Object.values(BADGE_DEFINITIONS)

describe('BADGE_DEFINITIONS — count', () => {
  it('defines 25 or more badges (system has expanded beyond the original 25)', () => {
    expect(allBadges.length).toBeGreaterThanOrEqual(25)
  })
})

describe('BADGE_DEFINITIONS — required fields', () => {
  it.each(allBadges)('badge "$type" has required fields', (badge) => {
    expect(badge.type).toBeTruthy()
    expect(typeof badge.type).toBe('string')
    expect(badge.name).toBeTruthy()
    expect(typeof badge.name).toBe('string')
    expect(badge.description).toBeTruthy()
    expect(typeof badge.description).toBe('string')
    expect(badge.emoji).toBeTruthy()
    expect(typeof badge.emoji).toBe('string')
    expect(badge.category).toBeTruthy()
    expect(VALID_CATEGORIES.has(badge.category)).toBe(true)
  })
})

describe('BADGE_DEFINITIONS — no duplicate IDs', () => {
  it('all badge type keys are unique', () => {
    const keys = Object.keys(BADGE_DEFINITIONS)
    const uniqueKeys = new Set(keys)
    expect(uniqueKeys.size).toBe(keys.length)
  })

  it('badge.type matches its key in BADGE_DEFINITIONS', () => {
    for (const [key, badge] of Object.entries(BADGE_DEFINITIONS)) {
      expect(badge.type).toBe(key)
    }
  })
})

describe('BADGE_DEFINITIONS — tier badges reference valid tier names', () => {
  const tierBadges = allBadges.filter((b) => b.category === 'tier')

  it('tier badges exist', () => {
    expect(tierBadges.length).toBeGreaterThan(0)
  })

  it.each(tierBadges)('tier badge "$type" references a valid tier in its type name', (badge) => {
    // tier badge types are like "tier_silver", "tier_gold", etc.
    const tierPart = badge.type.replace('tier_', '')
    expect(VALID_TIERS.has(tierPart)).toBe(true)
  })
})

describe('BADGE_DEFINITIONS — leveled badges', () => {
  const leveledBadges = allBadges.filter((b) => b.levels && b.levels.length > 0)

  it('leveled badges have between 1 and 5 levels', () => {
    for (const badge of leveledBadges) {
      expect(badge.levels!.length).toBeGreaterThanOrEqual(1)
      expect(badge.levels!.length).toBeLessThanOrEqual(5)
    }
  })

  it('each level has a valid level number (1-5)', () => {
    for (const badge of leveledBadges) {
      for (const lvl of badge.levels!) {
        expect([1, 2, 3, 4, 5]).toContain(lvl.level)
      }
    }
  })

  it('level thresholds are increasing within a badge', () => {
    for (const badge of leveledBadges) {
      const levels = badge.levels!
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i]!.threshold).toBeGreaterThan(levels[i - 1]!.threshold)
      }
    }
  })
})

describe('getBadgeDefinition helper', () => {
  it('returns the correct badge for a known type', () => {
    const badge = getBadgeDefinition('first_receipt')
    expect(badge.type).toBe('first_receipt')
    expect(badge.name).toBe('First Receipt')
  })
})

describe('getBadgesByCategory helper', () => {
  it('returns only badges with the requested category', () => {
    const spendingBadges = getBadgesByCategory('spending')
    expect(spendingBadges.length).toBeGreaterThan(0)
    for (const b of spendingBadges) {
      expect(b.category).toBe('spending')
    }
  })

  it('returns community badges including community_legend', () => {
    const communityBadges = getBadgesByCategory('community')
    const types = communityBadges.map((b) => b.type)
    expect(types).toContain('community_legend')
  })
})
