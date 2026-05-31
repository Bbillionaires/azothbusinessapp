import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Browser client (client components)
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Service role client — bypasses RLS. Use only in trusted server contexts.
export function createSupabaseServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Database type helpers
export type AdminRole = 'admin_staff' | 'admin_manager' | 'super_admin';

export type ReceiptStatus = 'pending' | 'approved' | 'rejected' | 'duplicate' | 'suspicious' | 'resubmission_requested';

export type BusinessStatus = 'pending' | 'active' | 'suspended' | 'closed' | 'rejected' | 'under_review';

export type LegendTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'legend'
  | 'hall_of_legends';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: AdminRole;
  avatar_url?: string;
  created_at: string;
  last_login?: string;
}

export interface Receipt {
  id: string;
  user_id: string;
  business_id?: string;
  total: number;
  subtotal?: number;
  tax?: number;
  merchant_name: string;
  receipt_date: string;
  receipt_time?: string;
  receipt_number?: string;
  created_at: string;
  status: ReceiptStatus;
  fraud_score: number;
  fraud_flags: string[];
  image_url?: string;
  items?: Array<{ name: string; price: number; qty?: number }>;
  ocr_data?: {
    raw_text?: string;
    confidence?: number;
    extracted_at?: string;
  };
  receipt_hash?: string;
  points_awarded?: number;
  review_notes?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  profiles?: { full_name?: string; email?: string; tier?: string; points_balance?: number } | null;
  businesses?: { name?: string; city?: string; state?: string } | null;
}

export interface Business {
  id: string;
  name: string;
  owner_id: string;
  status: BusinessStatus;
  category: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  website?: string;
  verified_at?: string;
  created_at: string;
  total_receipts?: number;
  total_points_issued?: number;
  fraud_receipt_count?: number;
}

export interface PlatformUser {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  created_at: string;
  total_points: number;
  total_receipts: number;
  approved_receipts: number;
  rejected_receipts: number;
  fraud_receipts: number;
  approval_rate: number;
  is_banned: boolean;
  ban_reason?: string;
  tier?: LegendTier;
}

export interface Dispute {
  id: string;
  user_id: string;
  type: 'receipt' | 'review' | 'fraud' | 'points' | 'account' | 'other';
  subject: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  receipt_id?: string;
  review_id?: string;
  business_id?: string;
  assigned_to?: string;
  resolution_note?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FraudAlert {
  id: string;
  receipt_id: string;
  user_id: string;
  fraud_score: number;
  fraud_flags: string[];
  detected_at: string;
  status: 'new' | 'investigating' | 'confirmed' | 'false_positive';
}

export interface CommunityLegend {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  tier: LegendTier;
  referrals_count: number;
  local_spending_total: number;
  reviews_count: number;
  impact_score: number;
  inducted_at: string;
  is_permanent: boolean;
  legend_bio?: string | null;
  profiles?: { full_name?: string; avatar_url?: string; tier?: string } | null;
}
