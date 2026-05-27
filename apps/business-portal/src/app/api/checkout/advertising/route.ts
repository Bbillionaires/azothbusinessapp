import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

const PRICE_IDS: Record<string, string> = {
  sponsored_listing: process.env.STRIPE_PRICE_SPONSORED_LISTING!,
  banner: process.env.STRIPE_PRICE_BANNER!,
  push_notification: process.env.STRIPE_PRICE_PUSH_NOTIFICATION!,
};

const AD_NAMES: Record<string, string> = {
  sponsored_listing: 'Sponsored Listing',
  banner: 'Banner Ad',
  push_notification: 'Push Notification',
};

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ad_type, business_id, campaign_name, target_city, budget } = await req.json();
  const priceId = PRICE_IDS[ad_type];
  if (!priceId) return NextResponse.json({ error: 'Invalid ad type' }, { status: 400 });

  // Create ad campaign record (status = draft until payment)
  const { data: campaign, error } = await supabase
    .from('ad_campaigns')
    .insert({
      advertiser_id: user.id,
      name: campaign_name || `${AD_NAMES[ad_type]} — ${new Date().toLocaleDateString()}`,
      type: ad_type,
      budget,
      spent: 0,
      target_city,
      status: 'draft',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const isRecurring = ad_type !== 'push_notification';

  const session = await stripe.checkout.sessions.create({
    mode: isRecurring ? 'subscription' : 'payment',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/advertising?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/advertising?cancelled=true`,
    customer_email: user.email,
    metadata: {
      type: 'ad_campaign',
      campaign_id: campaign.id,
      ad_type,
      business_id: business_id ?? '',
      user_id: user.id,
    },
  });

  return NextResponse.json({ checkout_url: session.url, campaign_id: campaign.id });
}
