// =============================================================================
// Business Types
// =============================================================================

export type BusinessStatus = 'pending' | 'active' | 'suspended' | 'closed' | 'rejected' | 'under_review';

export type VerificationLevel = 'none' | 'basic' | 'pro' | 'elite' | 'community_trusted';

export type VerificationRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'requires_more_info';

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'twitter'
  | 'youtube'
  | 'linkedin'
  | 'threads'
  | 'website';

// ---------------------------------------------------------------------------
// Business Hours
// ---------------------------------------------------------------------------
export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DayHours {
  open: string;   // "09:00" (24-hour)
  close: string;  // "17:00"
  closed: boolean;
}

export type BusinessHours = Partial<Record<DayOfWeek, DayHours>>;

// ---------------------------------------------------------------------------
// Business — mirrors public.businesses
// ---------------------------------------------------------------------------
export interface Business {
  id: string;
  owner_id: string;

  // Identity
  name: string;
  slug: string;
  description: string | null;
  family_name: string | null;
  year_founded: number | null;

  // Media
  logo_url: string | null;
  cover_url: string | null;

  // Contact
  phone: string | null;
  email: string | null;
  website: string | null;

  // Location
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;

  // Classification
  category: string;
  subcategory: string | null;
  tags: string[];
  hours: BusinessHours;

  // Status
  status: BusinessStatus;

  // Ownership badges
  is_local_owned: boolean;
  is_community_owned: boolean;
  is_veteran_owned: boolean;
  is_nonprofit_owned: boolean;
  is_woman_owned: boolean;

  // Verification
  verification_level: VerificationLevel;

  // Discovery flags
  is_featured: boolean;
  is_top_rated: boolean;
  is_premium: boolean;
  hiring_now: boolean;
  has_free_today: boolean;
  has_upcoming_event: boolean;
  has_investment_opportunity: boolean;

  // Referral program
  referral_percentage: number | null;
  referral_fixed_amount: number | null;

  // Aggregates
  total_reviews: number;
  average_rating: number | null;
  active_offers_count: number;

  // Feature tracking
  featured_at: string | null;
  featured_by: string | null;

  created_at: string;
  updated_at: string;
}

export type BusinessInsert = Omit<Business, 'id' | 'created_at' | 'updated_at' | 'total_reviews' | 'average_rating'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  total_reviews?: number;
  average_rating?: number | null;
};

export type BusinessUpdate = Partial<
  Omit<Business, 'id' | 'owner_id' | 'slug' | 'created_at' | 'updated_at' | 'total_reviews' | 'average_rating'>
>;

// ---------------------------------------------------------------------------
// Business Photos — mirrors public.business_photos
// ---------------------------------------------------------------------------
export interface BusinessPhoto {
  id: string;
  business_id: string;
  url: string;
  caption: string | null;
  is_primary: boolean;
  order_index: number;
  uploaded_by: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Business Videos — mirrors public.business_videos
// ---------------------------------------------------------------------------
export interface BusinessVideo {
  id: string;
  business_id: string;
  url: string;
  title: string | null;
  thumbnail_url: string | null;
  duration_sec: number | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Business Services — mirrors public.business_services
// ---------------------------------------------------------------------------
export interface BusinessService {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price_range: string | null;
  is_active: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Business Social Links — mirrors public.business_social
// ---------------------------------------------------------------------------
export interface BusinessSocial {
  id: string;
  business_id: string;
  platform: SocialPlatform;
  url: string;
  handle: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Business Followers — mirrors public.business_followers
// ---------------------------------------------------------------------------
export interface BusinessFollower {
  id: string;
  business_id: string;
  user_id: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Verification Request — mirrors public.business_verification_requests
// ---------------------------------------------------------------------------
export interface VerificationDocument {
  type: string;    // 'business_license' | 'ein' | 'utility_bill' | etc.
  url: string;
  name: string;
}

export interface BusinessVerificationRequest {
  id: string;
  business_id: string;
  level: VerificationLevel;
  status: VerificationRequestStatus;
  documents: VerificationDocument[];
  notes: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Composite types for UI
// ---------------------------------------------------------------------------
export interface BusinessFull extends Business {
  photos: BusinessPhoto[];
  videos: BusinessVideo[];
  services: BusinessService[];
  social: BusinessSocial[];
  follower_count: number;
  is_following?: boolean;
}

export interface BusinessCard
  extends Pick<
    Business,
    | 'id'
    | 'name'
    | 'slug'
    | 'logo_url'
    | 'cover_url'
    | 'category'
    | 'city'
    | 'state'
    | 'average_rating'
    | 'total_reviews'
    | 'is_featured'
    | 'is_local_owned'
    | 'is_community_owned'
    | 'is_veteran_owned'
    | 'is_woman_owned'
    | 'verification_level'
    | 'hiring_now'
    | 'has_upcoming_event'
    | 'has_free_today'
    | 'status'
  > {
  primary_photo?: string;
  distance_miles?: number;
}

// ---------------------------------------------------------------------------
// Business category map
// ---------------------------------------------------------------------------
export const BUSINESS_CATEGORIES = [
  'food_drink',
  'retail',
  'services',
  'health_wellness',
  'beauty',
  'automotive',
  'home_garden',
  'entertainment',
  'education',
  'nonprofit',
  'professional',
  'technology',
  'real_estate',
  'financial',
  'childcare',
  'fitness',
  'arts_crafts',
  'pet_services',
  'travel',
  'other',
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];
