import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

const PRICE_IDS: Record<string, string> = {
  basic: process.env.STRIPE_PRICE_GREENWOOD_BASIC!,
  pro: process.env.STRIPE_PRICE_GREENWOOD_PRO!,
  elite: process.env.STRIPE_PRICE_GREENWOOD_ELITE!,
};

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { tier, business_id } = await req.json();
  const priceId = PRICE_IDS[tier];

  if (!priceId) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
  }

  // Verify user owns this business
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('id', business_id)
    .eq('owner_id', user.id)
    .single();

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/verification?success=true&tier=${tier}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/verification?cancelled=true`,
    customer_email: user.email,
    metadata: {
      type: 'greenwood_verification',
      verification_level: tier,
      business_id,
      user_id: user.id,
    },
    subscription_data: {
      metadata: {
        type: 'greenwood_verification',
        verification_level: tier,
        business_id,
        user_id: user.id,
      },
    },
  });

  return NextResponse.json({ checkout_url: session.url });
}
