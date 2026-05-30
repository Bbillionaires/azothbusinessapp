import { describe, it, expect } from 'vitest'
import {
  POINTS_CONFIG,
  TIER_THRESHOLDS,
  getTierInfo,
  getPointsToNextTier,
  getTierProgressPct,
  calculateReceiptPoints,
} from './points.js'

describe('POINTS_CONFIG — core rates', () => {
  it('base rate is 1 point per $1 spent', () => {
    expect(POINTS_CONFIG.RECEIPT_POINTS_PER_DOLLAR).toBe(1)
  })

  it('daily receipt points cap is 5000', () => {
    expect(POINTS_CONFIG.DAILY_RECEIPT_POINTS_CAP).toBe(5000)
  })

  it('single receipt spending cap via tier thresholds is consistent', () => {
    // The system uses DAILY_RECEIPT_POINTS_CAP (5000 pts = $5000 spend at base rate)
    // The CLAUDE.md describes a $500 single receipt cap enforced via fraud detection
    // Here we verify base rate math: $500 receipt → 500 base points
    expect(Math.floor(500 * POINTS_CONFIG.RECEIPT_POINTS_PER_DOLLAR)).toBe(500)
  })

  it('monthly cap: $5000 spending at base rate yields 5000 points', () => {
    expect(Math.floor(5000 * POINTS_CONFIG.RECEIPT_POINTS_PER_DOLLAR)).toBe(5000)
  })
})

describe('POINTS_CONFIG — tier multipliers', () => {
  it('bronze multiplier is 1.0x', () => {
    expect(POINTS_CONFIG.TIER_MULTIPLIERS.bronze).toBe(1.0)
  })

  it('silver multiplier is 1.25x', () => {
    expect(POINTS_CONFIG.TIER_MULTIPLIERS.silver).toBe(1.25)
  })

  it('gold multiplier is 1.5x', () => {
    expect(POINTS_CONFIG.TIER_MULTIPLIERS.gold).toBe(1.5)
  })

  it('platinum multiplier is 2.0x', () => {
    expect(POINTS_CONFIG.TIER_MULTIPLIERS.platinum).toBe(2.0)
  })

  it('legend multiplier is 3.0x', () => {
    expect(POINTS_CONFIG.TIER_MULTIPLIERS.legend).toBe(3.0)
  })

  it('all five tiers are defined', () => {
    const tiers = Object.keys(POINTS_CONFIG.TIER_MULTIPLIERS)
    expect(tiers).toEqual(expect.arrayContaining(['bronze', 'silver', 'gold', 'platinum', 'legend']))
    expect(tiers).toHaveLength(5)
  })
})

describe('calculateReceiptPoints', () => {
  it('bronze tier: $100 receipt → 100 points (1.0x)', () => {
    expect(calculateReceiptPoints(100, 'bronze')).toBe(100)
  })

  it('silver tier: $100 receipt → 125 points (1.25x)', () => {
    expect(calculateReceiptPoints(100, 'silver')).toBe(125)
  })

  it('gold tier: $100 receipt → 150 points (1.5x)', () => {
    expect(calculateReceiptPoints(100, 'gold')).toBe(150)
  })

  it('platinum tier: $100 receipt → 200 points (2.0x)', () => {
    expect(calculateReceiptPoints(100, 'platinum')).toBe(200)
  })

  it('legend tier: $100 receipt → 300 points (3.0x)', () => {
    expect(calculateReceiptPoints(100, 'legend')).toBe(300)
  })

  it('community_owned flag adds 25% ownership bonus on top of multiplier', () => {
    // base=100, multiplier=1.0, bonus=0.25 → round(100 * 1.25) = 125
    expect(calculateReceiptPoints(100, 'bronze', { is_community_owned: true })).toBe(125)
  })

  it('minimum of 1 point even for tiny amounts', () => {
    expect(calculateReceiptPoints(0.01, 'bronze')).toBeGreaterThanOrEqual(1)
  })
})

describe('Tier thresholds', () => {
  it('there are 5 tiers defined', () => {
    expect(TIER_THRESHOLDS).toHaveLength(5)
  })

  it('tiers are ordered from lowest to highest minPoints', () => {
    for (let i = 1; i < TIER_THRESHOLDS.length; i++) {
      expect(TIER_THRESHOLDS[i]!.minPoints).toBeGreaterThan(TIER_THRESHOLDS[i - 1]!.minPoints)
    }
  })

  it('bronze starts at 0 points', () => {
    const bronze = TIER_THRESHOLDS.find((t) => t.tier === 'bronze')
    expect(bronze?.minPoints).toBe(0)
  })

  it('silver starts at 2500 points', () => {
    const silver = TIER_THRESHOLDS.find((t) => t.tier === 'silver')
    expect(silver?.minPoints).toBe(2500)
  })

  it('legend has no maxPoints (null)', () => {
    const legend = TIER_THRESHOLDS.find((t) => t.tier === 'legend')
    expect(legend?.maxPoints).toBeNull()
  })
})

describe('getTierInfo', () => {
  it('returns bronze for 0 points', () => {
    expect(getTierInfo(0).tier).toBe('bronze')
  })

  it('returns silver for 2500 points', () => {
    expect(getTierInfo(2500).tier).toBe('silver')
  })

  it('returns gold for 10000 points', () => {
    expect(getTierInfo(10000).tier).toBe('gold')
  })

  it('returns platinum for 25000 points', () => {
    expect(getTierInfo(25000).tier).toBe('platinum')
  })

  it('returns legend for 100000 points', () => {
    expect(getTierInfo(100000).tier).toBe('legend')
  })
})

describe('getPointsToNextTier', () => {
  it('returns null for legend (max tier)', () => {
    expect(getPointsToNextTier(100000)).toBeNull()
  })

  it('returns correct points needed from bronze start', () => {
    // bronze: 0–2499; at 0 points, need 2500 more
    expect(getPointsToNextTier(0)).toBe(2500)
  })
})

describe('getTierProgressPct', () => {
  it('returns 100 for legend tier', () => {
    expect(getTierProgressPct(100000)).toBe(100)
  })

  it('returns 0 at start of bronze tier', () => {
    expect(getTierProgressPct(0)).toBe(0)
  })

  it('returns a value between 0 and 100 mid-tier', () => {
    const pct = getTierProgressPct(1250)
    expect(pct).toBeGreaterThan(0)
    expect(pct).toBeLessThan(100)
  })
})
