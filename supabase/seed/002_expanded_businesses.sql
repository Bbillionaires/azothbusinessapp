-- Local First Rewards™ — Expanded Development Seed Data
-- Additional businesses, events, and offers for richer testing

-- ==================================================
-- MORE DEMO BUSINESSES (Jacksonville & Atlanta)
-- ==================================================

INSERT INTO businesses (id, name, category, description, address, city, state, zip, phone, website, status,
  is_local_owned, is_community_owned, is_woman_owned, is_veteran_owned, is_minority_owned,
  verification_level, owner_id, average_rating, review_count)
SELECT
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Riverside Coffee Roasters',
  'Restaurant',
  'Specialty coffee roastery and cafe featuring single-origin beans sourced directly from farmers. Known for our community gathering events and Saturday morning jazz sessions.',
  '720 Riverside Ave', 'Jacksonville', 'FL', '32204', '(904) 555-0301', 'https://riversidecoffee.com',
  'active', true, false, false, false, true, 'pro',
  (SELECT id FROM profiles WHERE role = 'consumer' LIMIT 1),
  4.8, 127
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'consumer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, category, description, address, city, state, zip, phone, status,
  is_local_owned, is_community_owned, is_woman_owned, is_veteran_owned,
  verification_level, owner_id, average_rating, review_count)
SELECT
  '44444444-4444-4444-4444-444444444444'::uuid,
  'Five Points Bookshop',
  'Retail',
  'Independent bookstore celebrating local authors and diverse voices. Curated selection of Black literature, history, and community stories. Monthly author meetups.',
  '1028 Park St', 'Jacksonville', 'FL', '32204', '(904) 555-0401',
  'active', true, true, true, false, 'elite',
  (SELECT id FROM profiles WHERE role = 'consumer' LIMIT 1),
  4.9, 89
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'consumer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, category, description, address, city, state, zip, phone, status,
  is_local_owned, is_community_owned, is_woman_owned, is_veteran_owned,
  verification_level, owner_id, average_rating, review_count)
SELECT
  '55555555-5555-5555-5555-555555555555'::uuid,
  'Heritage Barbershop',
  'Services',
  'Classic barbershop serving the community for over 20 years. Expert cuts, lineups, and grooming. A neighborhood institution.',
  '215 Main St N', 'Jacksonville', 'FL', '32202', '(904) 555-0501',
  'active', true, false, false, true, 'basic',
  (SELECT id FROM profiles WHERE role = 'consumer' LIMIT 1),
  4.7, 203
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'consumer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, category, description, address, city, state, zip, phone, website, status,
  is_local_owned, is_community_owned, is_woman_owned, is_veteran_owned, is_minority_owned,
  verification_level, owner_id, average_rating, review_count)
SELECT
  '66666666-6666-6666-6666-666666666666'::uuid,
  'Mama Rosa''s Kitchen',
  'Restaurant',
  'Home-cooked Latin fusion cuisine. Family recipes from three generations. Daily lunch specials and weekend brunch. Takeout and catering available.',
  '3421 Blanding Blvd', 'Jacksonville', 'FL', '32210', '(904) 555-0601', NULL,
  'active', true, false, true, false, true, 'basic',
  (SELECT id FROM profiles WHERE role = 'consumer' LIMIT 1),
  4.6, 156
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'consumer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, category, description, address, city, state, zip, phone, status,
  is_local_owned, is_community_owned, is_woman_owned,
  verification_level, owner_id, average_rating, review_count)
SELECT
  '77777777-7777-7777-7777-777777777777'::uuid,
  'SkinCare by Amara',
  'Beauty',
  'Licensed esthetician specializing in melanin-rich skin. Custom facials, natural hair care, and holistic beauty treatments. Walk-ins welcome.',
  '8922 Atlantic Blvd', 'Jacksonville', 'FL', '32211', '(904) 555-0701',
  'active', true, false, true, 'pro',
  (SELECT id FROM profiles WHERE role = 'consumer' LIMIT 1),
  5.0, 74
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'consumer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, category, description, address, city, state, zip, phone, status,
  is_local_owned, is_community_owned, is_veteran_owned,
  verification_level, owner_id, average_rating, review_count)
SELECT
  '88888888-8888-8888-8888-888888888888'::uuid,
  'Veterans Auto Repair',
  'Automotive',
  'Veteran-owned auto repair shop. Honest pricing, quality work, and a free inspection with every visit. Serving Jacksonville for 15 years.',
  '5500 Beach Blvd', 'Jacksonville', 'FL', '32207', '(904) 555-0801',
  'active', true, false, false, true, 'basic',
  (SELECT id FROM profiles WHERE role = 'consumer' LIMIT 1),
  4.7, 312
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'consumer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, category, description, address, city, state, zip, phone, status,
  is_local_owned, is_community_owned, is_minority_owned,
  verification_level, owner_id, average_rating, review_count)
SELECT
  '99999999-9999-9999-9999-999999999999'::uuid,
  'Fresh Cuts Produce Market',
  'Retail',
  'Family-owned produce market offering fresh fruits and vegetables sourced from local farms. Affordable prices, wide selection, and a community favorite.',
  '1201 Edgewood Ave W', 'Jacksonville', 'FL', '32208', '(904) 555-0901',
  'active', true, true, true, 'basic',
  (SELECT id FROM profiles WHERE role = 'consumer' LIMIT 1),
  4.5, 91
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'consumer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, category, description, address, city, state, zip, phone, status,
  is_local_owned, is_community_owned, is_woman_owned, is_minority_owned,
  verification_level, owner_id, average_rating, review_count)
SELECT
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'The Healing Arts Center',
  'Health',
  'Holistic wellness center offering massage therapy, yoga classes, meditation workshops, and nutritional counseling. Sliding scale pricing available for community members.',
  '2112 Oak St', 'Jacksonville', 'FL', '32204', '(904) 555-1001',
  'active', true, false, true, true, 'elite',
  (SELECT id FROM profiles WHERE role = 'consumer' LIMIT 1),
  4.9, 68
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'consumer')
ON CONFLICT (id) DO NOTHING;

-- ==================================================
-- MORE DEMO OFFERS
-- ==================================================

INSERT INTO business_offers (business_id, title, description, offer_type, discount_percent, is_active, points_bonus, starts_at, expires_at)
SELECT
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Happy Hour: $2 Off Any Specialty Drink',
  'Monday through Friday, 2pm–5pm, enjoy $2 off any specialty coffee or tea.',
  'discount', 15, true, 25,
  NOW(), NOW() + INTERVAL '3 months'
WHERE EXISTS (SELECT 1 FROM businesses WHERE id = '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

INSERT INTO business_offers (business_id, title, description, offer_type, discount_percent, is_active, points_bonus, starts_at, expires_at)
SELECT
  '44444444-4444-4444-4444-444444444444'::uuid,
  'Buy 2 Books, Get 1 Free',
  'Any 3 books from the featured local authors section — buy 2, get the cheapest one free.',
  'bogo', 33, true, 75,
  NOW(), NOW() + INTERVAL '2 months'
WHERE EXISTS (SELECT 1 FROM businesses WHERE id = '44444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;

INSERT INTO business_offers (business_id, title, description, offer_type, discount_percent, is_active, points_bonus, starts_at, expires_at)
SELECT
  '66666666-6666-6666-6666-666666666666'::uuid,
  '10% Off Catering Orders',
  'Planning an event? Get 10% off any catering order of $100 or more. Limited slots available.',
  'discount', 10, true, 100,
  NOW(), NOW() + INTERVAL '4 months'
WHERE EXISTS (SELECT 1 FROM businesses WHERE id = '66666666-6666-6666-6666-666666666666')
ON CONFLICT DO NOTHING;

INSERT INTO business_offers (business_id, title, description, offer_type, discount_percent, is_active, points_bonus, starts_at, expires_at)
SELECT
  '77777777-7777-7777-7777-777777777777'::uuid,
  'First Facial: 20% Off',
  'First-time clients receive 20% off any facial treatment. Book online or call today.',
  'discount', 20, true, 50,
  NOW(), NOW() + INTERVAL '2 months'
WHERE EXISTS (SELECT 1 FROM businesses WHERE id = '77777777-7777-7777-7777-777777777777')
ON CONFLICT DO NOTHING;

INSERT INTO business_offers (business_id, title, description, offer_type, discount_amount, is_active, points_bonus, starts_at, expires_at)
SELECT
  '88888888-8888-8888-8888-888888888888'::uuid,
  'Free Oil Change with Any Repair',
  'Get a free oil change (up to $45 value) with any repair totaling $150 or more.',
  'freebie', 45, true, 60,
  NOW(), NOW() + INTERVAL '3 months'
WHERE EXISTS (SELECT 1 FROM businesses WHERE id = '88888888-8888-8888-8888-888888888888')
ON CONFLICT DO NOTHING;

INSERT INTO business_offers (business_id, title, description, offer_type, discount_percent, is_active, points_bonus, starts_at, expires_at)
SELECT
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'Intro Yoga Class — Free',
  'New students get their first yoga class completely free. All levels welcome.',
  'freebie', 100, true, 30,
  NOW(), NOW() + INTERVAL '6 months'
WHERE EXISTS (SELECT 1 FROM businesses WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT DO NOTHING;

-- ==================================================
-- MORE DEMO EVENTS
-- ==================================================

INSERT INTO events (business_id, organizer_id, title, description, event_type, start_at, end_at, address, city, state, is_free, max_attendees, points_reward, status)
SELECT
  '44444444-4444-4444-4444-444444444444'::uuid,
  (SELECT id FROM profiles WHERE role = 'consumer' LIMIT 1),
  'Black Authors Spotlight Night',
  'Meet three local authors and hear them read from their latest works. Books available for purchase and signing.',
  'community',
  NOW() + INTERVAL '5 days',
  NOW() + INTERVAL '5 days' + INTERVAL '2 hours',
  '1028 Park St', 'Jacksonville', 'FL',
  true, 50, 50, 'published'
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'consumer')
ON CONFLICT DO NOTHING;

INSERT INTO events (business_id, organizer_id, title, description, event_type, start_at, end_at, address, city, state, is_free, ticket_price, max_attendees, points_reward, status)
SELECT
  '33333333-3333-3333-3333-333333333333'::uuid,
  (SELECT id FROM profiles WHERE role = 'consumer' LIMIT 1),
  'Saturday Morning Jazz & Coffee',
  'Start your Saturday right with live jazz and specialty pour-overs. Local musicians perform every week.',
  'community',
  NOW() + INTERVAL '3 days',
  NOW() + INTERVAL '3 days' + INTERVAL '3 hours',
  '720 Riverside Ave', 'Jacksonville', 'FL',
  false, 5.00, 80, 30, 'published'
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'consumer')
ON CONFLICT DO NOTHING;

INSERT INTO events (organizer_id, title, description, event_type, start_at, end_at, address, city, state, is_free, max_attendees, points_reward, status)
SELECT
  (SELECT id FROM profiles WHERE role = 'consumer' LIMIT 1),
  'Downtown Vendor Market',
  'Local artisans, food vendors, and service providers. Over 30 vendors. Free admission and parking.',
  'vendor_market',
  NOW() + INTERVAL '10 days',
  NOW() + INTERVAL '10 days' + INTERVAL '6 hours',
  'Hemming Park', 'Jacksonville', 'FL',
  true, 500, 100, 'published'
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'consumer')
ON CONFLICT DO NOTHING;

INSERT INTO events (business_id, organizer_id, title, description, event_type, start_at, end_at, address, city, state, is_free, max_attendees, points_reward, status)
SELECT
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  (SELECT id FROM profiles WHERE role = 'consumer' LIMIT 1),
  'Community Wellness Workshop: Stress & Healing',
  'Free workshop on managing everyday stress using holistic techniques. Includes guided meditation and Q&A.',
  'workshop',
  NOW() + INTERVAL '14 days',
  NOW() + INTERVAL '14 days' + INTERVAL '2 hours',
  '2112 Oak St', 'Jacksonville', 'FL',
  true, 30, 75, 'published'
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'consumer')
ON CONFLICT DO NOTHING;

INSERT INTO events (business_id, organizer_id, title, description, event_type, start_at, end_at, address, city, state, is_free, ticket_price, max_attendees, points_reward, status)
SELECT
  '66666666-6666-6666-6666-666666666666'::uuid,
  (SELECT id FROM profiles WHERE role = 'consumer' LIMIT 1),
  'Latin Food Truck Night',
  'Three local food trucks come together for an evening of amazing food, music, and community.',
  'food_truck',
  NOW() + INTERVAL '8 days',
  NOW() + INTERVAL '8 days' + INTERVAL '4 hours',
  '3421 Blanding Blvd', 'Jacksonville', 'FL',
  false, 5.00, 200, 40, 'published'
WHERE EXISTS (SELECT 1 FROM profiles WHERE role = 'consumer')
ON CONFLICT DO NOTHING;

-- ==================================================
-- DEMO JOB POSTINGS
-- ==================================================

INSERT INTO job_postings (business_id, title, description, employment_type, salary_min, salary_max, salary_type, location, city, state, is_active)
SELECT
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Part-Time Barista',
  'Looking for an enthusiastic barista to join our team. Experience with espresso equipment preferred. Flexible hours available.',
  'part_time', 13.00, 16.00, 'hourly',
  '720 Riverside Ave', 'Jacksonville', 'FL', true
WHERE EXISTS (SELECT 1 FROM businesses WHERE id = '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

INSERT INTO job_postings (business_id, title, description, employment_type, salary_min, salary_max, salary_type, location, city, state, is_active)
SELECT
  '22222222-2222-2222-2222-222222222222'::uuid,
  'Community Coding Instructor',
  'Teach beginner coding workshops to youth and adults. JavaScript or Python experience required. 10–15 hours/week.',
  'part_time', 20.00, 28.00, 'hourly',
  '456 Sweet Auburn Ave', 'Atlanta', 'GA', true
WHERE EXISTS (SELECT 1 FROM businesses WHERE id = '22222222-2222-2222-2222-222222222222')
ON CONFLICT DO NOTHING;

INSERT INTO job_postings (business_id, title, description, employment_type, salary_min, salary_max, salary_type, location, city, state, is_active)
SELECT
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'Licensed Massage Therapist',
  'Seeking a licensed massage therapist to join our wellness center. Flexible schedule, great work environment.',
  'full_time', 40000, 55000, 'annual',
  '2112 Oak St', 'Jacksonville', 'FL', true
WHERE EXISTS (SELECT 1 FROM businesses WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT DO NOTHING;

INSERT INTO job_postings (business_id, title, description, employment_type, salary_min, salary_max, salary_type, location, city, state, is_active)
SELECT
  '88888888-8888-8888-8888-888888888888'::uuid,
  'Auto Mechanic Apprentice',
  'Entry-level position for someone eager to learn auto repair. We train the right candidate. Veterans preferred.',
  'full_time', 35000, 45000, 'annual',
  '5500 Beach Blvd', 'Jacksonville', 'FL', true
WHERE EXISTS (SELECT 1 FROM businesses WHERE id = '88888888-8888-8888-8888-888888888888')
ON CONFLICT DO NOTHING;

-- ==================================================
-- REFERRAL MARKETPLACE LISTINGS
-- ==================================================

INSERT INTO referral_marketplace (business_id, title, description, type, rate, rate_type, max_budget, is_active, starts_at, ends_at)
SELECT
  '33333333-3333-3333-3333-333333333333'::uuid,
  'Refer Coffee Lovers — Earn Per Visit',
  'Earn $2 for every new customer you send our way. New customers must visit and make a purchase.',
  'pay_per_lead', 2.00, 'fixed',
  500.00, true,
  NOW(), NOW() + INTERVAL '6 months'
WHERE EXISTS (SELECT 1 FROM businesses WHERE id = '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

INSERT INTO referral_marketplace (business_id, title, description, type, rate, rate_type, max_budget, is_active, starts_at, ends_at)
SELECT
  '44444444-4444-4444-4444-444444444444'::uuid,
  'Book Enthusiast Referral Program',
  'Earn 10% commission on every book purchase made by customers you refer.',
  'commission', 10.00, 'percent',
  1000.00, true,
  NOW(), NOW() + INTERVAL '12 months'
WHERE EXISTS (SELECT 1 FROM businesses WHERE id = '44444444-4444-4444-4444-444444444444')
ON CONFLICT DO NOTHING;

INSERT INTO referral_marketplace (business_id, title, description, type, rate, rate_type, max_budget, is_active, starts_at, ends_at)
SELECT
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
  'Wellness Affiliate — 15% Commission',
  'Share our wellness services with your network. Earn 15% on any package or membership sold.',
  'affiliate', 15.00, 'percent',
  2000.00, true,
  NOW(), NOW() + INTERVAL '12 months'
WHERE EXISTS (SELECT 1 FROM businesses WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
ON CONFLICT DO NOTHING;
