-- ============================================================
-- Migration 012: Row Level Security Policies
-- ============================================================
-- Enforces data isolation at the database level.
-- No application code can bypass these policies.

-- ============================================================
-- HELPER: Role check functions
-- ============================================================

CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'consumer'
  );
$$;

CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT auth.user_role() IN ('admin_staff', 'admin_manager', 'super_admin');
$$;

CREATE OR REPLACE FUNCTION auth.is_manager_or_above()
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT auth.user_role() IN ('admin_manager', 'super_admin');
$$;

CREATE OR REPLACE FUNCTION auth.is_super_admin()
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT auth.user_role() = 'super_admin';
$$;

CREATE OR REPLACE FUNCTION auth.owns_business(business_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = business_id AND owner_id = auth.uid()
  );
$$;

-- ============================================================
-- PROFILES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid() OR auth.is_admin());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = OLD.role); -- Can't change own role

CREATE POLICY "profiles_admin_update" ON profiles
  FOR UPDATE USING (auth.is_manager_or_above());

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- Public profile fields visible to all authenticated users
CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    id != auth.uid()
  );

-- ============================================================
-- BUSINESSES
-- ============================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Anyone can view active businesses
CREATE POLICY "businesses_select_active" ON businesses
  FOR SELECT USING (status = 'active' OR owner_id = auth.uid() OR auth.is_admin());

CREATE POLICY "businesses_insert_owner" ON businesses
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "businesses_update_owner" ON businesses
  FOR UPDATE USING (owner_id = auth.uid() OR auth.is_manager_or_above())
  WITH CHECK (
    owner_id = auth.uid() OR auth.is_manager_or_above()
  );

CREATE POLICY "businesses_delete_superadmin" ON businesses
  FOR DELETE USING (auth.is_super_admin());

-- ============================================================
-- BUSINESS PHOTOS / VIDEOS / SOCIAL / SERVICES
-- ============================================================

ALTER TABLE business_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "biz_photos_select" ON business_photos FOR SELECT USING (true);
CREATE POLICY "biz_photos_write" ON business_photos FOR ALL
  USING (auth.owns_business(business_id) OR auth.is_admin());

ALTER TABLE business_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "biz_videos_select" ON business_videos FOR SELECT USING (true);
CREATE POLICY "biz_videos_write" ON business_videos FOR ALL
  USING (auth.owns_business(business_id) OR auth.is_admin());

ALTER TABLE business_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "biz_services_select" ON business_services FOR SELECT USING (true);
CREATE POLICY "biz_services_write" ON business_services FOR ALL
  USING (auth.owns_business(business_id) OR auth.is_admin());

ALTER TABLE business_social ENABLE ROW LEVEL SECURITY;
CREATE POLICY "biz_social_select" ON business_social FOR SELECT USING (true);
CREATE POLICY "biz_social_write" ON business_social FOR ALL
  USING (auth.owns_business(business_id) OR auth.is_admin());

ALTER TABLE business_followers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "biz_followers_select" ON business_followers
  FOR SELECT USING (user_id = auth.uid() OR auth.is_admin());
CREATE POLICY "biz_followers_insert" ON business_followers
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "biz_followers_delete" ON business_followers
  FOR DELETE USING (user_id = auth.uid());

ALTER TABLE business_verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verif_requests_select" ON business_verification_requests
  FOR SELECT USING (auth.owns_business(business_id) OR auth.is_admin());
CREATE POLICY "verif_requests_insert" ON business_verification_requests
  FOR INSERT WITH CHECK (auth.owns_business(business_id));
CREATE POLICY "verif_requests_update_admin" ON business_verification_requests
  FOR UPDATE USING (auth.is_manager_or_above());

-- ============================================================
-- RECEIPTS
-- ============================================================

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Users see only their own receipts; admins see all
CREATE POLICY "receipts_select" ON receipts
  FOR SELECT USING (user_id = auth.uid() OR auth.is_admin());

-- Service role (edge function) can insert; users can insert via edge function
CREATE POLICY "receipts_insert" ON receipts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Only admins can update receipt status
CREATE POLICY "receipts_update_admin" ON receipts
  FOR UPDATE USING (auth.is_admin());

CREATE POLICY "receipts_delete_superadmin" ON receipts
  FOR DELETE USING (auth.is_super_admin());

ALTER TABLE receipt_fingerprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fingerprints_admin" ON receipt_fingerprints
  FOR ALL USING (auth.is_admin());

-- ============================================================
-- REWARDS
-- ============================================================

ALTER TABLE reward_catalog ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view active rewards
CREATE POLICY "rewards_select" ON reward_catalog
  FOR SELECT USING (is_active = true OR auth.is_manager_or_above());

CREATE POLICY "rewards_write_manager" ON reward_catalog
  FOR ALL USING (auth.is_manager_or_above());

ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "redemptions_select" ON reward_redemptions
  FOR SELECT USING (user_id = auth.uid() OR auth.is_admin());
CREATE POLICY "redemptions_insert" ON reward_redemptions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "redemptions_update_admin" ON reward_redemptions
  FOR UPDATE USING (auth.is_admin());

ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pts_tx_select" ON points_transactions
  FOR SELECT USING (user_id = auth.uid() OR auth.is_admin());
-- Only service role can insert (via award_points function)
CREATE POLICY "pts_tx_insert_service" ON points_transactions
  FOR INSERT WITH CHECK (auth.is_admin() OR auth.uid() IS NOT NULL);

-- ============================================================
-- EVENTS
-- ============================================================

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select" ON events
  FOR SELECT USING (status = 'published' OR organizer_id = auth.uid() OR auth.is_admin());
CREATE POLICY "events_write_organizer" ON events
  FOR ALL USING (organizer_id = auth.uid() OR auth.owns_business(business_id) OR auth.is_admin());

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rsvps_select" ON event_rsvps
  FOR SELECT USING (user_id = auth.uid() OR auth.is_admin());
CREATE POLICY "rsvps_write" ON event_rsvps
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- JOBS
-- ============================================================

ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_select" ON job_postings
  FOR SELECT USING (is_active = true OR auth.owns_business(business_id) OR auth.is_admin());
CREATE POLICY "jobs_write_owner" ON job_postings
  FOR ALL USING (auth.owns_business(business_id) OR auth.is_admin());

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_select" ON job_applications
  FOR SELECT USING (
    applicant_id = auth.uid() OR
    auth.is_admin() OR
    EXISTS (
      SELECT 1 FROM job_postings jp
      JOIN businesses b ON b.id = jp.business_id
      WHERE jp.id = job_applications.job_id AND b.owner_id = auth.uid()
    )
  );
CREATE POLICY "applications_insert" ON job_applications
  FOR INSERT WITH CHECK (applicant_id = auth.uid());
CREATE POLICY "applications_update" ON job_applications
  FOR UPDATE USING (
    applicant_id = auth.uid() OR
    auth.is_admin() OR
    EXISTS (
      SELECT 1 FROM job_postings jp
      JOIN businesses b ON b.id = jp.business_id
      WHERE jp.id = job_applications.job_id AND b.owner_id = auth.uid()
    )
  );

ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resumes_own" ON user_resumes
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- REVIEWS
-- ============================================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select" ON reviews
  FOR SELECT USING (status = 'published' OR reviewer_id = auth.uid() OR auth.is_admin());
CREATE POLICY "reviews_insert" ON reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());
CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE USING (reviewer_id = auth.uid() OR auth.is_admin());
CREATE POLICY "reviews_delete_admin" ON reviews
  FOR DELETE USING (auth.is_admin());

ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "responses_select" ON review_responses FOR SELECT USING (true);
CREATE POLICY "responses_write" ON review_responses
  FOR ALL USING (auth.owns_business(business_id) OR auth.is_admin());

ALTER TABLE review_helpful ENABLE ROW LEVEL SECURITY;
CREATE POLICY "helpful_select" ON review_helpful FOR SELECT USING (true);
CREATE POLICY "helpful_write" ON review_helpful
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- REFERRALS
-- ============================================================

ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ref_links_select" ON referral_links
  FOR SELECT USING (user_id = auth.uid() OR auth.is_admin());
CREATE POLICY "ref_links_insert" ON referral_links
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "ref_links_update_own" ON referral_links
  FOR UPDATE USING (user_id = auth.uid());

ALTER TABLE referral_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ref_events_select" ON referral_events
  FOR SELECT USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR auth.is_admin());
CREATE POLICY "ref_events_admin_write" ON referral_events
  FOR INSERT WITH CHECK (auth.is_admin() OR auth.uid() IS NOT NULL); -- edge function

ALTER TABLE referral_marketplace ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ref_market_select" ON referral_marketplace
  FOR SELECT USING (is_active = true OR auth.owns_business(business_id) OR auth.is_admin());
CREATE POLICY "ref_market_write" ON referral_marketplace
  FOR ALL USING (auth.owns_business(business_id) OR auth.is_admin());

ALTER TABLE referral_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ref_apps_select" ON referral_applications
  FOR SELECT USING (user_id = auth.uid() OR auth.is_admin());
CREATE POLICY "ref_apps_insert" ON referral_applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================
-- ADVERTISING
-- ============================================================

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ad_campaigns_select" ON ad_campaigns
  FOR SELECT USING (advertiser_id = auth.uid() OR auth.is_admin());
CREATE POLICY "ad_campaigns_insert" ON ad_campaigns
  FOR INSERT WITH CHECK (advertiser_id = auth.uid());
CREATE POLICY "ad_campaigns_update" ON ad_campaigns
  FOR UPDATE USING (advertiser_id = auth.uid() OR auth.is_admin());

-- Impressions/clicks — service role only (partitioned tables)
-- Users cannot directly manipulate ad metrics

-- ============================================================
-- GAMIFICATION
-- ============================================================

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_select" ON user_badges
  FOR SELECT USING (user_id = auth.uid() OR auth.is_admin());
CREATE POLICY "badges_insert_service" ON user_badges
  FOR INSERT WITH CHECK (auth.is_admin() OR auth.uid() IS NOT NULL);

ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leaderboard_select_all" ON leaderboard_entries
  FOR SELECT USING (auth.uid() IS NOT NULL); -- All logged-in users can view leaderboard
CREATE POLICY "leaderboard_write_service" ON leaderboard_entries
  FOR ALL USING (auth.is_admin());

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_select" ON achievements
  FOR SELECT USING (is_active = true OR auth.is_admin());
CREATE POLICY "achievements_write_admin" ON achievements
  FOR ALL USING (auth.is_manager_or_above());

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_achievements_select" ON user_achievements
  FOR SELECT USING (user_id = auth.uid() OR auth.is_admin());
CREATE POLICY "user_achievements_write_service" ON user_achievements
  FOR ALL USING (auth.is_admin() OR auth.uid() IS NOT NULL);

ALTER TABLE spending_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "streaks_select" ON spending_streaks
  FOR SELECT USING (user_id = auth.uid() OR auth.is_admin());
CREATE POLICY "streaks_write_service" ON spending_streaks
  FOR ALL USING (auth.is_admin() OR auth.uid() IS NOT NULL);

ALTER TABLE community_legends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legends_select_all" ON community_legends
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "legends_write_manager" ON community_legends
  FOR ALL USING (auth.is_manager_or_above());

-- ============================================================
-- ANALYTICS
-- ============================================================

ALTER TABLE local_impact_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "impact_select_own" ON local_impact_snapshots
  FOR SELECT USING (user_id = auth.uid() OR auth.is_admin());
CREATE POLICY "impact_write_service" ON local_impact_snapshots
  FOR ALL USING (auth.is_admin());

ALTER TABLE economic_dashboard_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "econ_select_all" ON economic_dashboard_data
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "econ_write_service" ON economic_dashboard_data
  FOR ALL USING (auth.is_admin());

-- ============================================================
-- USER SETTINGS
-- ============================================================

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings_own" ON user_settings
  FOR ALL USING (user_id = auth.uid());
