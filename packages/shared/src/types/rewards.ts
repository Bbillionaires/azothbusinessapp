// =============================================================================
// Rewards, Points, and Redemption Types
// =============================================================================

import type { UserTier } from './user.js';

export type RewardType =
  | 'discount'
  | 'gift_card'
  | 'coupon'
  | 'event_ticket'
  | 'promotion'
  | 'community';

export type RedemptionStatus = 'pending' | 'completed' | 'expired' | 'cancelled';

export type TransactionType = 'earned' | 'spent' | 'bonus' | 'referral' | 'adjustment';

export type PointsReferenceType =
  | 'receipt'
  | 'redemption'
  | 'referral_event'
  | 'event'
  | 'bonus'
  | 'admin';

// ---------------------------------------------------------------------------
// Reward Catalog — mirrors public.reward_catalog
// ---------------------------------------------------------------------------
export interface RewardCatalogItem {
  id: string;
  name: string;
  description: string | null;
  type: RewardType;
  points_cost: number;
  value: number | null;
  business_id: string | null;
  quantity_available: number | null;
  quantity_redeemed: number;
  starts_at: string | null;
  expires_at: string | null;
  min_tier: UserTier | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type RewardCatalogInsert = Omit<
  RewardCatalogItem,
  'id' | 'quantity_redeemed' | 'created_at' | 'updated_at'
> & {
  id?: string;
  quantity_redeemed?: number;
};

// ---------------------------------------------------------------------------
// Reward Redemption — mirrors public.reward_redemptions
// ---------------------------------------------------------------------------
export interface RewardRedemption {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  status: RedemptionStatus;
  code: string | null;
  redeemed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Points Transaction — mirrors public.points_transactions
// ---------------------------------------------------------------------------
export interface PointsTransaction {
  id: string;
  user_id: string;
  amount: number;            // positive = credit, negative = debit
  type: TransactionType;
  reference_id: string | null;
  reference_type: PointsReferenceType | null;
  description: string;
  balance_after: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Composite types for UI
// ---------------------------------------------------------------------------
export interface RewardCatalogWithBusiness extends RewardCatalogItem {
  business?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  can_redeem?: boolean;          // true if user has enough points and meets tier
  is_sold_out?: boolean;
  is_expired?: boolean;
}

export interface RedemptionWithReward extends RewardRedemption {
  reward: Pick<
    RewardCatalogItem,
    'id' | 'name' | 'type' | 'value' | 'image_url'
  >;
}

export interface PointsLedgerEntry extends PointsTransaction {
  icon?: string;
  label?: string;
}

// ---------------------------------------------------------------------------
// Points balance breakdown
// ---------------------------------------------------------------------------
export interface PointsBalance {
  current_balance: number;
  total_earned: number;
  total_spent: number;
  pending_earned: number;     // points from pending receipts
}
