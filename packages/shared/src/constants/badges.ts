// =============================================================================
// Badge Constants — All badge definitions with metadata
// =============================================================================

import type { BadgeType } from '../types/badges.js';

export interface BadgeDefinition {
  type: BadgeType;
  name: string;
  emoji: string;
  description: string;
  category: 'spending' | 'community' | 'referral' | 'review' | 'event' | 'milestone' | 'tier' | 'ownership';
  levels?: BadgeLevelDefinition[];
}

export interface BadgeLevelDefinition {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
  threshold: number;   // e.g. number of receipts, days, referrals
}

export const BADGE_DEFINITIONS: Record<BadgeType, BadgeDefinition> = {
  first_receipt: {
    type: 'first_receipt',
    name: 'First Receipt',
    emoji: '🧾',
    description: 'Submitted your first local receipt',
    category: 'spending',
  },

  receipt_streak_7: {
    type: 'receipt_streak_7',
    name: '7-Day Streak',
    emoji: '🔥',
    description: 'Shopped local 7 days in a row',
    category: 'spending',
  },

  receipt_streak_30: {
    type: 'receipt_streak_30',
    name: '30-Day Streak',
    emoji: '🔥🔥',
    description: 'Shopped local 30 days in a row',
    category: 'spending',
  },

  receipt_streak_90: {
    type: 'receipt_streak_90',
    name: '90-Day Streak',
    emoji: '💫',
    description: 'Shopped local 90 days in a row',
    category: 'spending',
  },

  receipt_streak_365: {
    type: 'receipt_streak_365',
    name: 'Year of Local',
    emoji: '🌟',
    description: 'Shopped local every day for a full year',
    category: 'spending',
  },

  local_shopper: {
    type: 'local_shopper',
    name: 'Local Shopper',
    emoji: '🛍️',
    description: 'Submitted multiple receipts from local businesses',
    category: 'spending',
    levels: [
      { level: 1, name: 'Local Shopper',      description: '10 receipts',   threshold: 10 },
      { level: 2, name: 'Regular',            description: '50 receipts',   threshold: 50 },
      { level: 3, name: 'Dedicated Local',    description: '100 receipts',  threshold: 100 },
      { level: 4, name: 'Local Devotee',      description: '250 receipts',  threshold: 250 },
      { level: 5, name: 'Local Legend',       description: '500 receipts',  threshold: 500 },
    ],
  },

  community_builder: {
    type: 'community_builder',
    name: 'Community Builder',
    emoji: '🏘️',
    description: 'Supported community-owned businesses',
    category: 'community',
    levels: [
      { level: 1, name: 'Community Friend',   description: '5 businesses',  threshold: 5 },
      { level: 2, name: 'Community Ally',     description: '15 businesses', threshold: 15 },
      { level: 3, name: 'Community Pillar',   description: '30 businesses', threshold: 30 },
      { level: 4, name: 'Community Champion', description: '60 businesses', threshold: 60 },
      { level: 5, name: 'Community Icon',     description: '100 businesses', threshold: 100 },
    ],
  },

  business_supporter: {
    type: 'business_supporter',
    name: 'Business Supporter',
    emoji: '💼',
    description: 'Shopped at multiple unique local businesses',
    category: 'spending',
    levels: [
      { level: 1, name: 'Explorer',           description: '5 businesses',  threshold: 5 },
      { level: 2, name: 'Adventurer',         description: '15 businesses', threshold: 15 },
      { level: 3, name: 'Connector',          description: '30 businesses', threshold: 30 },
      { level: 4, name: 'Champion',           description: '75 businesses', threshold: 75 },
      { level: 5, name: 'Local Economy Hero', description: '150 businesses', threshold: 150 },
    ],
  },

  neighborhood_hero: {
    type: 'neighborhood_hero',
    name: 'Neighborhood Hero',
    emoji: '🦸',
    description: 'Spent significant dollars keeping money in the local economy',
    category: 'spending',
    levels: [
      { level: 1, name: 'Neighbor',           description: '$500 local spending',   threshold: 500 },
      { level: 2, name: 'Block Captain',      description: '$1,500 local spending', threshold: 1500 },
      { level: 3, name: 'Block Leader',       description: '$5,000 local spending', threshold: 5000 },
      { level: 4, name: 'Neighborhood MVP',   description: '$15,000 local spending', threshold: 15000 },
      { level: 5, name: 'Neighborhood Hero',  description: '$50,000 local spending', threshold: 50000 },
    ],
  },

  city_champion: {
    type: 'city_champion',
    name: 'City Champion',
    emoji: '🏆',
    description: 'One of the top local spenders in your city',
    category: 'spending',
  },

  event_goer: {
    type: 'event_goer',
    name: 'Event Goer',
    emoji: '🎉',
    description: 'Attended local community events',
    category: 'event',
    levels: [
      { level: 1, name: 'Event Goer',         description: '3 events',  threshold: 3 },
      { level: 2, name: 'Event Regular',      description: '10 events', threshold: 10 },
      { level: 3, name: 'Event Buff',         description: '25 events', threshold: 25 },
      { level: 4, name: 'Event Addict',       description: '50 events', threshold: 50 },
      { level: 5, name: 'Super Attender',     description: '100 events', threshold: 100 },
    ],
  },

  event_enthusiast: {
    type: 'event_enthusiast',
    name: 'Event Enthusiast',
    emoji: '🎊',
    description: 'Passionate community event attendee',
    category: 'event',
  },

  super_attender: {
    type: 'super_attender',
    name: 'Super Attender',
    emoji: '⭐',
    description: 'Attended 100+ community events',
    category: 'event',
  },

  referral_starter: {
    type: 'referral_starter',
    name: 'Referral Starter',
    emoji: '🤝',
    description: 'Made your first successful referral',
    category: 'referral',
  },

  referral_pro: {
    type: 'referral_pro',
    name: 'Referral Pro',
    emoji: '💰',
    description: 'Referred many people to the platform',
    category: 'referral',
    levels: [
      { level: 1, name: 'Connector',          description: '5 referrals',   threshold: 5 },
      { level: 2, name: 'Networker',          description: '15 referrals',  threshold: 15 },
      { level: 3, name: 'Influencer',         description: '50 referrals',  threshold: 50 },
      { level: 4, name: 'Ambassador',         description: '100 referrals', threshold: 100 },
      { level: 5, name: 'Referral Legend',    description: '500 referrals', threshold: 500 },
    ],
  },

  referral_legend: {
    type: 'referral_legend',
    name: 'Referral Legend',
    emoji: '🌐',
    description: '500+ successful referrals',
    category: 'referral',
  },

  review_writer: {
    type: 'review_writer',
    name: 'Review Writer',
    emoji: '✍️',
    description: 'Wrote reviews to help the community',
    category: 'review',
    levels: [
      { level: 1, name: 'Reviewer',           description: '5 reviews',   threshold: 5 },
      { level: 2, name: 'Critic',             description: '20 reviews',  threshold: 20 },
      { level: 3, name: 'Authority',          description: '50 reviews',  threshold: 50 },
      { level: 4, name: 'Voice of the People', description: '100 reviews', threshold: 100 },
      { level: 5, name: 'Review Legend',      description: '250 reviews', threshold: 250 },
    ],
  },

  top_reviewer: {
    type: 'top_reviewer',
    name: 'Top Reviewer',
    emoji: '📝',
    description: 'Your reviews are highly rated as helpful',
    category: 'review',
  },

  verified_reviewer: {
    type: 'verified_reviewer',
    name: 'Verified Reviewer',
    emoji: '✅',
    description: 'All your reviews are verified purchases',
    category: 'review',
  },

  job_helper: {
    type: 'job_helper',
    name: 'Job Helper',
    emoji: '💼',
    description: 'Helped connect someone with local employment',
    category: 'community',
  },

  early_adopter: {
    type: 'early_adopter',
    name: 'Early Adopter',
    emoji: '🚀',
    description: 'Among the first to join Local First Rewards',
    category: 'milestone',
  },

  community_legend: {
    type: 'community_legend',
    name: 'Community Legend',
    emoji: '👑',
    description: 'Inducted into the Community Legends program',
    category: 'community',
  },

  hall_of_fame: {
    type: 'hall_of_fame',
    name: 'Hall of Fame',
    emoji: '🏛️',
    description: 'Permanent Hall of Legends inductee',
    category: 'milestone',
  },

  veteran_supporter: {
    type: 'veteran_supporter',
    name: 'Veteran Supporter',
    emoji: '🎖️',
    description: 'Regular customer of veteran-owned businesses',
    category: 'ownership',
  },

  woman_supporter: {
    type: 'woman_supporter',
    name: 'Women-Owned Supporter',
    emoji: '💜',
    description: 'Regular customer of women-owned businesses',
    category: 'ownership',
  },

  nonprofit_supporter: {
    type: 'nonprofit_supporter',
    name: 'Nonprofit Supporter',
    emoji: '❤️',
    description: 'Regular supporter of local nonprofits',
    category: 'ownership',
  },

  big_spender: {
    type: 'big_spender',
    name: 'Big Spender',
    emoji: '💵',
    description: 'Significant total local spending',
    category: 'spending',
  },

  points_millionaire: {
    type: 'points_millionaire',
    name: 'Points Millionaire',
    emoji: '💎',
    description: 'Earned 1,000,000 lifetime points',
    category: 'milestone',
  },

  tier_silver: {
    type: 'tier_silver',
    name: 'Silver Member',
    emoji: '🥈',
    description: 'Reached Silver tier',
    category: 'tier',
  },

  tier_gold: {
    type: 'tier_gold',
    name: 'Gold Member',
    emoji: '🥇',
    description: 'Reached Gold tier',
    category: 'tier',
  },

  tier_platinum: {
    type: 'tier_platinum',
    name: 'Platinum Member',
    emoji: '💿',
    description: 'Reached Platinum tier',
    category: 'tier',
  },

  tier_legend: {
    type: 'tier_legend',
    name: 'Legend Member',
    emoji: '👑',
    description: 'Reached the highest Legend tier',
    category: 'tier',
  },
};

// Helper: get badge by type
export function getBadgeDefinition(type: BadgeType): BadgeDefinition {
  return BADGE_DEFINITIONS[type];
}

// Helper: get all badges in a category
export function getBadgesByCategory(
  category: BadgeDefinition['category']
): BadgeDefinition[] {
  return Object.values(BADGE_DEFINITIONS).filter((b) => b.category === category);
}
