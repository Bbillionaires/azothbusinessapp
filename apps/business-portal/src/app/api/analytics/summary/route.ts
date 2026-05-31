import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get('business_id');
  if (!businessId) return NextResponse.json({ error: 'business_id required' }, { status: 400 });

  // Verify ownership
  const { data: biz } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('id', businessId)
    .eq('owner_id', user.id)
    .single();

  if (!biz) return NextResponse.json({ error: 'Business not found or unauthorized' }, { status: 403 });

  // Use service role for aggregate queries
  const service = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [receiptsRes, reviewsRes, followersRes, offersRes, weeklyRes] = await Promise.all([
    // Total approved receipts for this business
    service.from('receipts')
      .select('total, user_id, created_at')
      .eq('business_id', businessId)
      .eq('status', 'approved'),

    // Reviews aggregation
    service.from('reviews')
      .select('weight, rating, reviewer_id')
      .eq('business_id', businessId)
      .eq('status', 'published'),

    // Follower count
    service.from('business_followers')
      .select('user_id, created_at', { count: 'exact', head: false })
      .eq('business_id', businessId),

    // Offer redemptions
    service.from('offer_redemptions')
      .select('id, redeemed_at')
      .in('offer_id',
        (await service.from('business_offers').select('id').eq('business_id', businessId)).data?.map(o => o.id) ?? []
      ),

    // Weekly receipts breakdown (last 8 weeks)
    service.from('receipts')
      .select('total, created_at')
      .eq('business_id', businessId)
      .eq('status', 'approved')
      .gte('created_at', new Date(now.getTime() - 56 * 24 * 3600 * 1000).toISOString()),
  ]);

  const receipts = receiptsRes.data ?? [];
  const reviews = reviewsRes.data ?? [];
  const followers = followersRes.data ?? [];
  const redemptions = offersRes.data ?? [];
  const weeklyReceipts = weeklyRes.data ?? [];

  // Compute totals
  const totalRevenue = receipts.reduce((sum, r) => sum + (r.total ?? 0), 0);
  const thisMonthRevenue = receipts.filter(r => r.created_at >= thisMonthStart)
    .reduce((sum, r) => sum + (r.total ?? 0), 0);
  const lastMonthRevenue = receipts.filter(r => r.created_at >= lastMonthStart && r.created_at < thisMonthStart)
    .reduce((sum, r) => sum + (r.total ?? 0), 0);

  const avgReceipt = receipts.length > 0 ? totalRevenue / receipts.length : 0;

  // Top customers by spending
  const customerMap = new Map<string, number>();
  for (const r of receipts) {
    customerMap.set(r.user_id, (customerMap.get(r.user_id) ?? 0) + (r.total ?? 0));
  }
  const topCustomers = [...customerMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([userId, spent]) => ({ user_id: userId, total_spent: spent }));

  // Weekly spending breakdown
  const weekMap = new Map<string, number>();
  for (const r of weeklyReceipts) {
    const d = new Date(r.created_at);
    const weekKey = new Date(d.setDate(d.getDate() - d.getDay())).toISOString().split('T')[0];
    weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + (r.total ?? 0));
  }
  const weeklyData = [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, amount]) => ({ week, amount: Math.round(amount) }));

  // Review stats
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length
    : 0;
  const weightedAvg = reviews.length > 0
    ? reviews.reduce((s, r) => s + ((r.rating ?? 0) * (r.weight ?? 1)), 0) /
      reviews.reduce((s, r) => s + (r.weight ?? 1), 0)
    : 0;

  // New followers this month
  const newFollowers = followers.filter(f => f.created_at >= thisMonthStart).length;

  return NextResponse.json({
    business: biz,
    revenue: {
      total: Math.round(totalRevenue * 100) / 100,
      this_month: Math.round(thisMonthRevenue * 100) / 100,
      last_month: Math.round(lastMonthRevenue * 100) / 100,
      growth_pct: lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : null,
    },
    receipts: {
      total: receipts.length,
      this_month: receipts.filter(r => r.created_at >= thisMonthStart).length,
      avg_amount: Math.round(avgReceipt * 100) / 100,
    },
    reviews: {
      total: reviews.length,
      avg_rating: Math.round(avgRating * 10) / 10,
      weighted_avg: Math.round(weightedAvg * 10) / 10,
    },
    followers: {
      total: followers.length,
      new_this_month: newFollowers,
    },
    offers: {
      total_redemptions: redemptions.length,
      this_month: redemptions.filter(r => r.redeemed_at >= thisMonthStart).length,
    },
    top_customers: topCustomers,
    weekly_spending: weeklyData,
  });
}
