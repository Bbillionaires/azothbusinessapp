import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

/**
 * Scheduled function that computes analytics snapshots.
 * Triggered daily via pg_cron or Supabase scheduled functions.
 */
Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Validate cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const serviceClient = getServiceClient();

  const results: Record<string, any> = {};

  try {
    // 1. Compute user impact snapshots for all active users
    const { data: activeUsers } = await serviceClient
      .from('profiles')
      .select('id')
      .eq('role', 'consumer')
      .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    let snapshotCount = 0;
    if (activeUsers) {
      for (const user of activeUsers) {
        try {
          await serviceClient.rpc('compute_user_impact_snapshot', { p_user_id: user.id });
          snapshotCount++;
        } catch (e) {
          console.error(`Snapshot failed for user ${user.id}:`, e);
        }
      }
    }
    results.user_snapshots = snapshotCount;

    // 2. Compute economic dashboard data per city
    const { data: cities } = await serviceClient
      .from('businesses')
      .select('city')
      .eq('status', 'active');

    const uniqueCities = [...new Set((cities ?? []).map((b: any) => b.city))];
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const periodEnd = now.toISOString().split('T')[0];

    for (const city of uniqueCities) {
      const [spendingRes, businessRes, jobsRes, receiptsRes, redemptionsRes] = await Promise.all([
        // Total local spending
        serviceClient.rpc('city_spending_total', { p_city: city, p_start: periodStart, p_end: periodEnd }),
        // New businesses
        serviceClient.from('businesses').select('id', { count: 'exact', head: true }).eq('city', city).gte('created_at', periodStart),
        // Job postings
        serviceClient.from('job_postings').select('id', { count: 'exact', head: true })
          .in('business_id',
            (await serviceClient.from('businesses').select('id').eq('city', city)).data?.map((b: any) => b.id) ?? []
          ).eq('is_active', true),
        // Receipt volume
        serviceClient.from('receipts').select('id', { count: 'exact', head: true }).gte('created_at', periodStart),
        // Reward redemptions
        serviceClient.from('reward_redemptions').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('created_at', periodStart),
      ]);

      await serviceClient.from('economic_dashboard_data').upsert({
        city,
        period_start: periodStart,
        period_end: periodEnd,
        total_local_spending: spendingRes.data ?? 0,
        new_businesses: businessRes.count ?? 0,
        job_postings: jobsRes.count ?? 0,
        receipt_volume: receiptsRes.count ?? 0,
        reward_redemptions: redemptionsRes.count ?? 0,
        created_at: new Date().toISOString(),
      }, { onConflict: 'city,period_start' });
    }
    results.cities_computed = uniqueCities.length;

    // 3. Update leaderboards
    await updateLeaderboards(serviceClient);
    results.leaderboards_updated = true;

    // 4. Check and update Community Legend tiers
    await updateLegendTiers(serviceClient);
    results.legends_updated = true;

    // 5. Expire old rewards
    const { count: expiredRewards } = await serviceClient
      .from('reward_catalog')
      .update({ is_active: false })
      .lt('expires_at', now.toISOString())
      .eq('is_active', true)
      .select('id', { count: 'exact', head: true });
    results.rewards_expired = expiredRewards ?? 0;

    // 6. Compute offer analytics: active offer counts per business + top businesses by redemptions
    await updateOfferAnalytics(serviceClient, now);
    results.offer_analytics_updated = true;

    return new Response(
      JSON.stringify({ success: true, computed_at: now.toISOString(), ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('compute-analytics error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function updateLeaderboards(supabase: any) {
  const periods = ['monthly', 'alltime'] as const;
  const categories = ['spending', 'referrals', 'reviews', 'impact'] as const;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  for (const period of periods) {
    const since = period === 'monthly' ? monthStart : '2020-01-01T00:00:00Z';

    for (const category of categories) {
      let query;

      switch (category) {
        case 'spending':
          query = supabase.rpc('leaderboard_spending', { p_since: since });
          break;
        case 'referrals':
          query = supabase.rpc('leaderboard_referrals', { p_since: since });
          break;
        case 'reviews':
          query = supabase.rpc('leaderboard_reviews', { p_since: since });
          break;
        case 'impact':
          query = supabase.rpc('leaderboard_impact', { p_since: since });
          break;
      }

      const { data: rows } = await query;
      if (!rows) continue;

      const entries = rows.slice(0, 100).map((row: any, i: number) => ({
        user_id: row.user_id,
        period,
        category,
        rank: i + 1,
        score: row.score,
        updated_at: now.toISOString(),
      }));

      if (entries.length > 0) {
        await supabase.from('leaderboard_entries').upsert(entries, {
          onConflict: 'user_id,period,category',
        });
      }
    }
  }
}

async function updateOfferAnalytics(supabase: any, now: Date) {
  // Count active offers per business and update businesses table
  const { data: offerCounts } = await supabase
    .from('business_offers')
    .select('business_id')
    .eq('is_active', true);

  if (offerCounts && offerCounts.length > 0) {
    const countByBusiness: Record<string, number> = {};
    for (const row of offerCounts) {
      countByBusiness[row.business_id] = (countByBusiness[row.business_id] ?? 0) + 1;
    }

    for (const [businessId, count] of Object.entries(countByBusiness)) {
      await supabase
        .from('businesses')
        .update({ active_offers_count: count, updated_at: now.toISOString() })
        .eq('id', businessId);
    }

    // Zero out businesses that now have no active offers
    const businessesWithOffers = Object.keys(countByBusiness);
    if (businessesWithOffers.length > 0) {
      await supabase
        .from('businesses')
        .update({ active_offers_count: 0, updated_at: now.toISOString() })
        .eq('is_active', true)
        .gt('active_offers_count', 0)
        .not('id', 'in', `(${businessesWithOffers.map(id => `'${id}'`).join(',')})`);
    }
  }

  // Compute top businesses by offer redemptions (current month)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: redemptions } = await supabase
    .from('offer_redemptions')
    .select('business_id')
    .gte('created_at', monthStart)
    .eq('status', 'completed');

  if (redemptions && redemptions.length > 0) {
    const redemptionsByBusiness: Record<string, number> = {};
    for (const row of redemptions) {
      redemptionsByBusiness[row.business_id] = (redemptionsByBusiness[row.business_id] ?? 0) + 1;
    }

    // Upsert into offer_analytics table with monthly redemption counts
    const periodStart = monthStart.split('T')[0];
    const periodEnd = now.toISOString().split('T')[0];

    const analyticsRows = Object.entries(redemptionsByBusiness).map(([businessId, count]) => ({
      business_id: businessId,
      period_start: periodStart,
      period_end: periodEnd,
      offer_redemptions: count,
      updated_at: now.toISOString(),
    }));

    await supabase
      .from('offer_analytics')
      .upsert(analyticsRows, { onConflict: 'business_id,period_start' });
  }
}

async function updateLegendTiers(supabase: any) {
  const TIER_THRESHOLDS = {
    bronze: 100,
    silver: 500,
    gold: 2000,
    platinum: 5000,
    legend: 10000,
  };

  const { data: legends } = await supabase
    .from('community_legends')
    .select('id, user_id, impact_score, tier, is_permanent');

  for (const legend of legends ?? []) {
    if (legend.is_permanent) continue;

    let newTier = 'bronze';
    for (const [tier, threshold] of Object.entries(TIER_THRESHOLDS).reverse()) {
      if (legend.impact_score >= threshold) {
        newTier = tier;
        break;
      }
    }

    if (newTier !== legend.tier) {
      await supabase
        .from('community_legends')
        .update({ tier: newTier })
        .eq('id', legend.id);

      // Notify user of tier change
      await supabase.functions.invoke('send-notification', {
        body: {
          user_id: legend.user_id,
          title: '🏆 Legend Tier Update!',
          body: `Your Community Legend tier has been updated to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)}!`,
          type: 'badge_earned',
        },
      });
    }
  }
}
