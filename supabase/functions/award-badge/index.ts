import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

interface BadgeCheckRequest {
  user_id: string;
  trigger: 'receipt_approved' | 'review_submitted' | 'referral_completed' | 'event_attended' | 'profile_updated' | 'tier_upgraded';
}

interface BadgeCriteria {
  badge_type: string;
  badge_name: string;
  check: (stats: UserStats) => boolean;
  metadata?: Record<string, any>;
}

interface UserStats {
  receipts_approved: number;
  total_spent: number;
  reviews_count: number;
  referrals_count: number;
  events_attended: number;
  tier: string;
  points_balance: number;
  total_points_earned: number;
  profile_complete: boolean;
  businesses_followed: number;
  streak_days: number;
  job_applications_count: number;
  is_community_legend: boolean;
  account_created_at: string;
}

const BADGE_CRITERIA: BadgeCriteria[] = [
  // Spending milestones
  { badge_type: 'first_receipt', badge_name: '🧾 First Receipt', check: s => s.receipts_approved >= 1 },
  { badge_type: 'spender_10', badge_name: '💵 $100 Local Spender', check: s => s.total_spent >= 100 },
  { badge_type: 'big_spender', badge_name: '💰 Big Spender', check: s => s.total_spent >= 500 },
  { badge_type: 'spender_500', badge_name: '💰 $500 Local Spender', check: s => s.total_spent >= 500 },
  { badge_type: 'spender_1000', badge_name: '🏆 $1,000 Local Spender', check: s => s.total_spent >= 1000 },
  { badge_type: 'spender_5000', badge_name: '👑 $5,000 Local Champion', check: s => s.total_spent >= 5000 },

  // Receipt milestones
  { badge_type: 'receipts_10', badge_name: '📜 10 Receipts', check: s => s.receipts_approved >= 10 },
  { badge_type: 'receipt_master', badge_name: '📚 Receipt Master', check: s => s.receipts_approved >= 50 },
  { badge_type: 'receipts_50', badge_name: '📚 50 Receipts', check: s => s.receipts_approved >= 50 },
  { badge_type: 'receipts_100', badge_name: '🗂️ Receipt Veteran', check: s => s.receipts_approved >= 100 },

  // Review milestones
  { badge_type: 'first_review', badge_name: '⭐ First Review', check: s => s.reviews_count >= 1 },
  { badge_type: 'reviewer', badge_name: '📝 Reviewer', check: s => s.reviews_count >= 5 },
  { badge_type: 'reviewer_5', badge_name: '📝 5 Reviews', check: s => s.reviews_count >= 5 },
  { badge_type: 'reviewer_25', badge_name: '✍️ Trusted Voice', check: s => s.reviews_count >= 25 },

  // Referral milestones
  { badge_type: 'first_referral', badge_name: '👥 First Referral', check: s => s.referrals_count >= 1 },
  { badge_type: 'referrer_5', badge_name: '🤝 5 Referrals', check: s => s.referrals_count >= 5 },
  { badge_type: 'referral_king', badge_name: '👑 Referral King', check: s => s.referrals_count >= 10 },
  { badge_type: 'referrer_25', badge_name: '🌟 Super Connector', check: s => s.referrals_count >= 25 },
  { badge_type: 'referrer_100', badge_name: '🚀 Community Builder', check: s => s.referrals_count >= 100 },

  // Events
  { badge_type: 'event_goer', badge_name: '🎪 Event Goer', check: s => s.events_attended >= 3 },
  { badge_type: 'first_event', badge_name: '🎪 First Event', check: s => s.events_attended >= 1 },
  { badge_type: 'events_10', badge_name: '📅 10 Events', check: s => s.events_attended >= 10 },

  // Jobs
  { badge_type: 'job_seeker', badge_name: '💼 Job Seeker', check: s => s.job_applications_count >= 1 },

  // Community Legend
  { badge_type: 'local_legend', badge_name: '🏛️ Local Legend', check: s => s.is_community_legend },

  // Early Adopter (joined before 2025-01-01)
  { badge_type: 'early_adopter', badge_name: '🌱 Early Adopter', check: s => s.account_created_at < '2025-01-01' },

  // Tier badges
  { badge_type: 'tier_silver', badge_name: '🥈 Silver Member', check: s => ['silver', 'gold', 'platinum', 'legend'].includes(s.tier) },
  { badge_type: 'tier_gold', badge_name: '🥇 Gold Member', check: s => ['gold', 'platinum', 'legend'].includes(s.tier) },
  { badge_type: 'tier_platinum', badge_name: '💎 Platinum Member', check: s => ['platinum', 'legend'].includes(s.tier) },
  { badge_type: 'tier_legend', badge_name: '👑 Community Legend', check: s => s.tier === 'legend' },

  // Streak badges
  { badge_type: 'streak_3', badge_name: '🔥 3-Day Streak', check: s => s.streak_days >= 3 },
  { badge_type: 'streak_7', badge_name: '🔥 7-Day Streak', check: s => s.streak_days >= 7 },
  { badge_type: 'streak_30', badge_name: '⚡ 30-Day Streak', check: s => s.streak_days >= 30 },
  { badge_type: 'streak_100', badge_name: '💫 100-Day Streak', check: s => s.streak_days >= 100 },
];

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const serviceClient = getServiceClient();

  let body: BadgeCheckRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Get user stats
    const stats = await getUserStats(body.user_id, serviceClient);

    // 2. Get already-earned badges
    const { data: earnedBadges } = await serviceClient
      .from('user_badges')
      .select('badge_type')
      .eq('user_id', body.user_id);

    const earnedTypes = new Set((earnedBadges ?? []).map((b: any) => b.badge_type));

    // 3. Check all criteria
    const newBadges: Array<{ badge_type: string; badge_name: string }> = [];

    for (const criteria of BADGE_CRITERIA) {
      if (!earnedTypes.has(criteria.badge_type) && criteria.check(stats)) {
        newBadges.push({
          badge_type: criteria.badge_type,
          badge_name: criteria.badge_name,
        });
      }
    }

    // 4. Award new badges
    if (newBadges.length > 0) {
      await serviceClient.from('user_badges').insert(
        newBadges.map(badge => ({
          user_id: body.user_id,
          badge_type: badge.badge_type,
          badge_name: badge.badge_name,
          earned_at: new Date().toISOString(),
          metadata: { trigger: body.trigger },
        }))
      );

      // 5. Send push notification for each new badge
      for (const badge of newBadges) {
        await serviceClient.functions.invoke('send-notification', {
          body: {
            user_id: body.user_id,
            title: '🏅 Badge Earned!',
            body: `You earned the "${badge.badge_name}" badge!`,
            type: 'badge_earned',
            data: { badge_type: badge.badge_type },
          },
        });
      }
    }

    return new Response(
      JSON.stringify({
        new_badges: newBadges,
        total_badges: earnedTypes.size + newBadges.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getUserStats(userId: string, supabase: any): Promise<UserStats> {
  const [profileRes, receiptsRes, reviewsRes, referralsRes, eventsRes, followersRes, streakRes] =
    await Promise.all([
      supabase.from('profiles').select('tier, points_balance, total_points_earned').eq('id', userId).single(),
      supabase.from('receipts').select('total').eq('user_id', userId).eq('status', 'approved'),
      supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('reviewer_id', userId).eq('status', 'published'),
      supabase.from('referral_events').select('id', { count: 'exact', head: true }).eq('referrer_id', userId).eq('status', 'completed'),
      supabase.from('event_rsvps').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'going'),
      supabase.from('business_followers').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('spending_streaks').select('current_streak').eq('user_id', userId).single(),
    ]);

  const receipts = receiptsRes.data ?? [];
  const totalSpent = receipts.reduce((s: number, r: any) => s + (r.total ?? 0), 0);

  return {
    receipts_approved: receipts.length,
    total_spent: totalSpent,
    reviews_count: reviewsRes.count ?? 0,
    referrals_count: referralsRes.count ?? 0,
    events_attended: eventsRes.count ?? 0,
    tier: profileRes.data?.tier ?? 'bronze',
    points_balance: profileRes.data?.points_balance ?? 0,
    total_points_earned: profileRes.data?.total_points_earned ?? 0,
    profile_complete: true,
    businesses_followed: followersRes.count ?? 0,
    streak_days: streakRes.data?.current_streak ?? 0,
  };
}
