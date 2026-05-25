// =============================================================================
// Badges & Gamification Types
// =============================================================================

import type { UserTier } from './user.js';

export type LegendTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'legend'
  | 'hall_of_legends';

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'alltime';

export type LeaderboardCategory = 'spending' | 'referrals' | 'reviews' | 'impact';

// ---------------------------------------------------------------------------
// User Badge — mirrors public.user_badges
// ---------------------------------------------------------------------------
export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  badge_name: string;
  badge_emoji: string | null;
  level: 1 | 2 | 3 | 4 | 5;
  earned_at: string;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Badge type enum (all possible badge_type values)
// ---------------------------------------------------------------------------
export type BadgeType =
  | 'first_receipt'
  | 'receipt_streak_7'
  | 'receipt_streak_30'
  | 'receipt_streak_90'
  | 'receipt_streak_365'
  | 'local_shopper'
  | 'community_builder'
  | 'business_supporter'
  | 'neighborhood_hero'
  | 'city_champion'
  | 'event_goer'
  | 'event_enthusiast'
  | 'super_attender'
  | 'referral_starter'
  | 'referral_pro'
  | 'referral_legend'
  | 'review_writer'
  | 'top_reviewer'
  | 'verified_reviewer'
  | 'job_helper'
  | 'early_adopter'
  | 'community_legend'
  | 'hall_of_fame'
  | 'veteran_supporter'
  | 'woman_supporter'
  | 'nonprofit_supporter'
  | 'big_spender'
  | 'points_millionaire'
  | 'tier_silver'
  | 'tier_gold'
  | 'tier_platinum'
  | 'tier_legend';

// ---------------------------------------------------------------------------
// Achievement — mirrors public.achievements
// ---------------------------------------------------------------------------
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  criteria: AchievementCriteria;
  points_reward: number;
  badge_reward: BadgeType | null;
  is_hidden: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export type AchievementCriteriaType =
  | 'receipt_count'
  | 'receipt_total'
  | 'unique_businesses'
  | 'streak_days'
  | 'referral_count'
  | 'review_count'
  | 'event_attendance'
  | 'points_earned'
  | 'tier_reached'
  | 'badge_earned';

export interface AchievementCriteria {
  type: AchievementCriteriaType;
  threshold: number;
  period?: 'daily' | 'weekly' | 'monthly' | 'alltime';
  filter?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// User Achievement — mirrors public.user_achievements
// ---------------------------------------------------------------------------
export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  target: number;
  completed_at: string | null;
  notified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserAchievementWithDetails extends UserAchievement {
  achievement: Achievement;
  progress_pct: number;  // 0-100
}

// ---------------------------------------------------------------------------
// Leaderboard Entry — mirrors public.leaderboard_entries
// ---------------------------------------------------------------------------
export interface LeaderboardEntry {
  id: string;
  user_id: string;
  period: LeaderboardPeriod;
  category: LeaderboardCategory;
  rank: number;
  score: number;
  city: string | null;
  state: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntryWithProfile extends LeaderboardEntry {
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    tier: UserTier;
    city: string | null;
    state: string | null;
  };
  badges?: UserBadge[];
}

// ---------------------------------------------------------------------------
// Spending Streak — mirrors public.spending_streaks
// ---------------------------------------------------------------------------
export interface SpendingStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  freeze_tokens: number;
  total_streak_days: number;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Community Legend — mirrors public.community_legends
// ---------------------------------------------------------------------------
export interface CommunityLegend {
  id: string;
  user_id: string;
  tier: LegendTier;
  referrals_count: number;
  businesses_referred: number;
  local_spending_total: number;
  reviews_count: number;
  events_attended: number;
  impact_score: number;
  inducted_at: string;
  last_evaluated_at: string;
  is_permanent: boolean;
  legend_bio: string | null;
  featured_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityLegendWithProfile extends CommunityLegend {
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    tier: UserTier;
    city: string | null;
    state: string | null;
  };
  badges?: UserBadge[];
}
