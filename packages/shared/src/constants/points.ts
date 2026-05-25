// =============================================================================
// Points System Configuration
// =============================================================================

import type { UserTier } from '../types/user.js';
import type { TierInfo } from '../types/user.js';

// ---------------------------------------------------------------------------
// Points earning rates
// ---------------------------------------------------------------------------
export const POINTS_CONFIG = {
  // Receipt-based earning
  RECEIPT_POINTS_PER_DOLLAR: 1,          // base: 1 point per $1 spent

  // Tier multipliers on receipt points
  TIER_MULTIPLIERS: {
    bronze:   1.0,
    silver:   1.25,
    gold:     1.5,
    platinum: 2.0,
    legend:   3.0,
  } satisfies Record<UserTier, number>,

  // Bonus points for ownership badges
  OWNERSHIP_BONUS: {
    community_owned: 0.25,   // +25% on top of base
    veteran_owned:   0.10,   // +10%
    woman_owned:     0.10,   // +10%
    nonprofit:       0.15,   // +15%
    local_owned:     0.05,   // +5%
  },

  // One-time events
  SIGNUP_BONUS:              500,
  FIRST_RECEIPT_BONUS:       250,
  PROFILE_COMPLETE_BONUS:    150,
  FIRST_REVIEW_BONUS:        100,
  BIRTHDAY_BONUS:            500,

  // Referral points
  REFERRAL_USER_SIGNUP:      500,
  REFERRAL_BUSINESS_SIGNUP:  1000,
  REFERRAL_PREMIUM_PURCHASE: 750,
  REFERRAL_GREENWOOD_PURCHASE: 250,
  REFERRAL_SALE_PCT:         0.01,   // 1% of sale amount as points

  // Engagement points
  REVIEW_SUBMIT:             50,
  REVIEW_VERIFIED_PURCHASE:  25,      // bonus for verified purchase review
  REVIEW_HELPFUL_BONUS:      10,      // per helpful vote (capped)
  EVENT_ATTENDANCE:          100,     // base; events can set their own
  JOB_APPLICATION:           25,

  // Streak bonuses (awarded on top of normal earning)
  STREAK_BONUS: {
    7:   50,     // 7-day streak
    14:  150,
    30:  500,
    60:  1000,
    90:  2000,
    180: 5000,
    365: 10000,
  },

  // Daily caps to prevent abuse
  DAILY_RECEIPT_POINTS_CAP:  5000,
  DAILY_REVIEW_POINTS_CAP:   200,
  DAILY_REFERRAL_POINTS_CAP: 10000,

  // Expiry
  POINTS_EXPIRE_AFTER_DAYS: 365,    // points expire after 1 year of inactivity
} as const;

// ---------------------------------------------------------------------------
// Tier thresholds (lifetime points earned)
// ---------------------------------------------------------------------------
export const TIER_THRESHOLDS: TierInfo[] = [
  {
    tier:      'bronze',
    label:     'Bronze',
    emoji:     '🥉',
    minPoints: 0,
    maxPoints: 2499,
    color:     '#CD7F32',
    bgColor:   '#FDF0E8',
  },
  {
    tier:      'silver',
    label:     'Silver',
    emoji:     '🥈',
    minPoints: 2500,
    maxPoints: 9999,
    color:     '#C0C0C0',
    bgColor:   '#F5F5F5',
  },
  {
    tier:      'gold',
    label:     'Gold',
    emoji:     '🥇',
    minPoints: 10000,
    maxPoints: 24999,
    color:     '#FFD700',
    bgColor:   '#FFFDE7',
  },
  {
    tier:      'platinum',
    label:     'Platinum',
    emoji:     '💿',
    minPoints: 25000,
    maxPoints: 99999,
    color:     '#E5E4E2',
    bgColor:   '#F0F0F0',
  },
  {
    tier:      'legend',
    label:     'Legend',
    emoji:     '👑',
    minPoints: 100000,
    maxPoints: null,
    color:     '#9C27B0',
    bgColor:   '#F3E5F5',
  },
];

// ---------------------------------------------------------------------------
// Community Legend tier thresholds
// ---------------------------------------------------------------------------
export const LEGEND_TIER_THRESHOLDS = {
  bronze: {
    referrals_count:        5,
    local_spending_total:   1000,
    reviews_count:          10,
    events_attended:        5,
    impact_score:           100,
  },
  silver: {
    referrals_count:        15,
    local_spending_total:   5000,
    reviews_count:          25,
    events_attended:        15,
    impact_score:           500,
  },
  gold: {
    referrals_count:        50,
    local_spending_total:   15000,
    reviews_count:          50,
    events_attended:        30,
    impact_score:           2000,
  },
  platinum: {
    referrals_count:        150,
    local_spending_total:   50000,
    reviews_count:          100,
    events_attended:        75,
    impact_score:           8000,
  },
  legend: {
    referrals_count:        500,
    local_spending_total:   150000,
    reviews_count:          250,
    events_attended:        150,
    impact_score:           25000,
  },
  hall_of_legends: {
    referrals_count:        1000,
    local_spending_total:   500000,
    reviews_count:          500,
    events_attended:        300,
    impact_score:           100000,
  },
} as const;

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/** Get tier info for a given number of lifetime points */
export function getTierInfo(totalPointsEarned: number): TierInfo {
  for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
    const tier = TIER_THRESHOLDS[i];
    if (tier !== undefined && totalPointsEarned >= tier.minPoints) {
      return tier;
    }
  }
  return TIER_THRESHOLDS[0]!;
}

/** Get points needed to reach the next tier */
export function getPointsToNextTier(totalPointsEarned: number): number | null {
  const current = getTierInfo(totalPointsEarned);
  if (current.maxPoints === null) return null;
  return current.maxPoints + 1 - totalPointsEarned;
}

/** Get progress percentage within the current tier (0-100) */
export function getTierProgressPct(totalPointsEarned: number): number {
  const current = getTierInfo(totalPointsEarned);
  if (current.maxPoints === null) return 100;
  const range = current.maxPoints + 1 - current.minPoints;
  const progress = totalPointsEarned - current.minPoints;
  return Math.min(100, Math.round((progress / range) * 100));
}

/** Calculate receipt points for a user, including tier multiplier */
export function calculateReceiptPoints(
  total: number,
  tier: UserTier,
  ownershipFlags?: {
    is_community_owned?: boolean;
    is_veteran_owned?: boolean;
    is_woman_owned?: boolean;
    is_nonprofit_owned?: boolean;
    is_local_owned?: boolean;
  }
): number {
  const base = Math.floor(total * POINTS_CONFIG.RECEIPT_POINTS_PER_DOLLAR);
  const multiplier = POINTS_CONFIG.TIER_MULTIPLIERS[tier];
  let bonus = 0;

  if (ownershipFlags) {
    if (ownershipFlags.is_community_owned) bonus += POINTS_CONFIG.OWNERSHIP_BONUS.community_owned;
    if (ownershipFlags.is_veteran_owned)   bonus += POINTS_CONFIG.OWNERSHIP_BONUS.veteran_owned;
    if (ownershipFlags.is_woman_owned)     bonus += POINTS_CONFIG.OWNERSHIP_BONUS.woman_owned;
    if (ownershipFlags.is_nonprofit_owned) bonus += POINTS_CONFIG.OWNERSHIP_BONUS.nonprofit;
    if (ownershipFlags.is_local_owned)     bonus += POINTS_CONFIG.OWNERSHIP_BONUS.local_owned;
  }

  return Math.max(1, Math.round(base * (multiplier + bonus)));
}

/** Get all tier thresholds as a lookup map */
export const TIER_MAP = new Map<UserTier, TierInfo>(
  TIER_THRESHOLDS.map((t) => [t.tier, t])
);
