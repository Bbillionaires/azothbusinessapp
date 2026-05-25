// =============================================================================
// User & Auth Types
// =============================================================================

export type UserRole =
  | 'consumer'
  | 'business'
  | 'investor'
  | 'advertiser'
  | 'admin_staff'
  | 'admin_manager'
  | 'super_admin';

export type UserTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legend';

// ---------------------------------------------------------------------------
// Profile — mirrors public.profiles
// ---------------------------------------------------------------------------
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  referral_code: string;
  referred_by: string | null;
  points_balance: number;
  total_points_earned: number;
  tier: UserTier;
  bio: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  is_public_profile: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'> & {
  created_at?: string;
  updated_at?: string;
};

export type ProfileUpdate = Partial<
  Pick<
    Profile,
    | 'full_name'
    | 'avatar_url'
    | 'phone'
    | 'bio'
    | 'city'
    | 'state'
    | 'zip'
    | 'is_public_profile'
  >
>;

// ---------------------------------------------------------------------------
// User Settings — mirrors public.user_settings
// ---------------------------------------------------------------------------
export interface UserSettings {
  user_id: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  sms_notifications: boolean;
  leaderboard_visible: boolean;
  show_spending_on_profile: boolean;
  preferred_language: string;
  preferred_currency: string;
  dark_mode: boolean;
  updated_at: string;
}

export type UserSettingsUpdate = Partial<Omit<UserSettings, 'user_id' | 'updated_at'>>;

// ---------------------------------------------------------------------------
// Composite types for UI
// ---------------------------------------------------------------------------
export interface ProfileWithSettings {
  profile: Profile;
  settings: UserSettings;
}

export interface ProfilePublic
  extends Pick<
    Profile,
    | 'id'
    | 'full_name'
    | 'avatar_url'
    | 'referral_code'
    | 'tier'
    | 'total_points_earned'
    | 'city'
    | 'state'
    | 'created_at'
  > {}

// ---------------------------------------------------------------------------
// Tier thresholds (re-exported from constants, but typed here for convenience)
// ---------------------------------------------------------------------------
export interface TierInfo {
  tier: UserTier;
  label: string;
  emoji: string;
  minPoints: number;
  maxPoints: number | null;
  color: string;
  bgColor: string;
}
