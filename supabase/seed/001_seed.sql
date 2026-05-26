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
