-- Local First Rewards™ — Development Seed Data
-- Run after all migrations to populate demo data

-- ==================================================
-- REWARD CATALOG (admin configured)
-- ==================================================
INSERT INTO reward_catalog (name, description, type, points_cost, value, quantity_available, is_active, expires_at) VALUES
('10% Off Any Local Purchase',    'Get 10% off your next purchase at any participating local business', 'discount',   500,  10,   500,  true, NOW() + INTERVAL '6 months'),
('$25 Local Business Gift Card',  'A $25 gift card redeemable at any Greenwood Verified business',    'gift_card',  2500, 25,   100,  true, NOW() + INTERVAL '12 months'),
('$50 Community Gift Card',       '$50 toward any community-owned business',                          'gift_card',  5000, 50,   50,   true, NOW() + INTERVAL '12 months'),
('Event Ticket — General',        'Free ticket to any upcoming Local First Rewards community event',  'event_ticket', 750, 15,  200,  true, NOW() + INTERVAL '3 months'),
('Buy One Get One Coupon',        'BOGO on any purchase at participating restaurants',                'coupon',     300,  20,   300,  true, NOW() + INTERVAL '2 months'),
('20% Off Local Services',        '20% off your next service appointment at a participating business', 'coupon',    1000, 20,   150,  true, NOW() + INTERVAL '4 months'),
('Community Landmark Tour',       'Free guided tour of Jacksonville historic businesses',             'community',  1500, 30,   30,   true, NOW() + INTERVAL '3 months'),
('$100 Grand Reward',             'Redeem for $100 in local business credit',                        'gift_card',  10000, 100, 25,   true, NOW() + INTERVAL '12 months');

-- ==================================================
-- ACHIEVEMENTS
-- ==================================================
INSERT INTO achievements (name, description, icon, criteria, points_reward, is_active) VALUES
('First Steps',          'Submit your first receipt',                          '🧾', '{"receipts_approved": 1}',   50,  true),
('Local Champion',       'Spend $500 at local businesses',                     '🏆', '{"total_spent": 500}',      200,  true),
('Community Pillar',     'Spend $1,000 at local businesses',                   '👑', '{"total_spent": 1000}',     500,  true),
('Super Connector',      'Refer 10 friends to Local First Rewards',            '🌟', '{"referrals": 10}',         300,  true),
('Trusted Voice',        'Leave 25 reviews',                                   '✍️', '{"reviews": 25}',           250,  true),
('Event Enthusiast',     'Attend 10 community events',                         '🎪', '{"events": 10}',            150,  true),
('Streak Master',        'Maintain a 30-day spending streak',                  '🔥', '{"streak_days": 30}',       400,  true),
('Neighborhood Hero',    'Support 50 different local businesses',              '🏘️', '{"businesses_supported": 50}', 750, true),
('Legend in the Making', 'Achieve Gold tier',                                  '🥇', '{"tier": "gold"}',         1000,  true);

-- ==================================================
-- DEMO BUSINESS CATEGORIES & TAGS (reference data)
-- ==================================================
-- These are used for filtering/search taxonomy.
-- In production these would live in a categories table.
-- Stored as a comment here for developer reference:
--
-- Categories: restaurant, retail, services, health, beauty, fitness,
--   entertainment, education, nonprofit, technology, real_estate,
--   automotive, food_truck, professional_services
--
-- Ownership: local_owned, community_owned, veteran_owned,
--   nonprofit_owned, woman_owned, minority_owned
--
-- Verification: none, basic, pro, elite, community_trusted
--
-- Activity badges: hiring_now, free_today, upcoming_event,
--   vendor_market, food_truck_event, grand_opening,
--   special_offer, investment_opportunity

-- ==================================================
-- DEMO BUSINESSES (sample data for development)
-- ==================================================
-- Note: these use fixed UUIDs so they can be referenced by other seed data
INSERT INTO businesses (id, name, category, description, address, city, state, zip, phone, website, status,
  is_local_owned, is_community_owned, is_woman_owned, is_veteran_owned,
  verification_level, owner_id)
SELECT
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Soul Food Kitchen',
  'Restaurant',
  'Authentic Southern soul food made with family recipes passed down for generations. Fresh daily specials.',
  '123 Auburn Ave NE', 'Atlanta', 'GA', '30303', '(404) 555-0101', 'https://soulfoodkitchen.com',
  'active', true, true, true, false, 'basic',
  (SELECT id FROM profiles WHERE role = 'consumer' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'consumer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, category, description, address, city, state, zip, phone, status,
  is_local_owned, is_community_owned, verification_level, owner_id)
SELECT
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Community Tech Hub',
  'Technology',
  'Co-working space and tech education center serving the local community. Free Wi-Fi and coding workshops.',
  '456 Sweet Auburn Ave', 'Atlanta', 'GA', '30312', '(404) 555-0202',
  'active', true, true, 'pro',
  (SELECT id FROM profiles WHERE role = 'consumer' LIMIT 1)
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'consumer')
ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- DEMO OFFERS (tied to demo businesses)
-- ==================================================
INSERT INTO business_offers (business_id, title, description, offer_type, discount_percent, is_active, points_bonus, starts_at, expires_at)
SELECT
  '11111111-1111-1111-1111-111111111111'::uuid,
  '20% Off Soul Food Sunday Specials',
  'Every Sunday, enjoy 20% off our famous fried chicken, collard greens, and sweet potato pie.',
  'discount', 20, true, 50,
  NOW(), NOW() + INTERVAL '3 months'
WHERE EXISTS (SELECT 1 FROM businesses WHERE id = '11111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;

INSERT INTO business_offers (business_id, title, description, offer_type, discount_amount, promo_code, is_active, points_bonus, starts_at, expires_at)
SELECT
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Free Day Pass for New Members',
  'First-time visitors get a complimentary day pass to experience our co-working space.',
  'freebie', 25, 'WELCOME25', true, 100,
  NOW(), NOW() + INTERVAL '6 months'
WHERE EXISTS (SELECT 1 FROM businesses WHERE id = '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

-- ==================================================
-- DEMO EVENTS
-- ==================================================
INSERT INTO events (business_id, organizer_id, title, description, type, start_at, end_at, address, city, is_free, points_reward, status)
SELECT
  '22222222-2222-2222-2222-222222222222'::uuid,
  (SELECT id FROM profiles WHERE role = 'consumer' LIMIT 1),
  'Free Python Coding Workshop',
  'Learn Python basics in this hands-on 3-hour workshop. No prior experience needed. Laptop required.',
  'workshop',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days' + INTERVAL '3 hours',
  '456 Sweet Auburn Ave', 'Atlanta',
  true, 75, 'published'
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'consumer')
ON CONFLICT DO NOTHING;

-- ==================================================
-- SYSTEM CONFIGURATION DEFAULTS
-- (stored in a key-value config table)
-- ==================================================
-- If you add a system_config table, seed with:
-- INSERT INTO system_config (key, value, description) VALUES
-- ('points_per_dollar',        '1',    'Points earned per $1 spent on receipts'),
-- ('receipt_daily_cap',        '500',  'Max points per user per day from receipts'),
-- ('review_points',            '10',   'Points for submitting a review'),
-- ('event_check_in_points',    '25',   'Points for attending an event'),
-- ('referral_user_points',     '100',  'Points for referring a new user'),
-- ('referral_business_points', '500',  'Points for referring a new business'),
-- ('tier_silver_min',          '1000', 'Min points for Silver tier'),
-- ('tier_gold_min',            '5000', 'Min points for Gold tier'),
-- ('tier_platinum_min',        '20000','Min points for Platinum tier'),
-- ('tier_legend_min',          '100000','Min points for Legend tier'),
-- ('fraud_review_score',       '30',   'Fraud score threshold for manual review'),
-- ('fraud_auto_reject_score',  '90',   'Fraud score threshold for auto-rejection'),
-- ('receipt_max_age_days',     '30',   'Max age of receipt in days'),
-- ('max_single_receipt_amount','500',  'Max dollar amount for a single receipt'),
-- ('price_greenwood_basic',    '9.99', 'Monthly price for Greenwood Basic'),
-- ('price_greenwood_pro',      '29.99','Monthly price for Greenwood Pro'),
-- ('price_greenwood_elite',    '79.99','Monthly price for Greenwood Elite'),
-- ('age_new_business_max',     '3',    'Max years for New Business badge'),
-- ('age_legacy_min',           '10',   'Min years for Legacy Business badge'),
-- ('age_historic_min',         '25',   'Min years for Historic Business badge'),
-- ('age_landmark_min',         '50',   'Min years for Community Landmark badge');
