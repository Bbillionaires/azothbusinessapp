import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

interface ProcessReferralRequest {
  referral_code: string;
  event_type: 'user_signup' | 'business_signup' | 'premium_purchase' | 'greenwood_purchase' | 'sale';
  referred_user_id: string;
  sale_amount?: number;
}

const POINTS_MAP: Record<string, number> = {
  user_signup: 100,
  business_signup: 500,
  premium_purchase: 250,
  greenwood_purchase: 150,
  sale: 0, // calculated from percentage
};

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const serviceClient = getServiceClient();

  let body: ProcessReferralRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // 1. Look up referral link by code
    const { data: referralLink, error: linkError } = await serviceClient
      .from('referral_links')
      .select('id, user_id')
      .eq('code', body.referral_code)
      .single();

    if (linkError || !referralLink) {
      return new Response(JSON.stringify({ error: 'Invalid referral code' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Prevent self-referral
    if (referralLink.user_id === body.referred_user_id) {
      return new Response(JSON.stringify({ error: 'Cannot self-refer' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Check for duplicate referral event (same referrer+referred+type)
    const { data: existingEvent } = await serviceClient
      .from('referral_events')
      .select('id')
      .eq('referrer_id', referralLink.user_id)
      .eq('referred_id', body.referred_user_id)
      .eq('type', body.event_type)
      .single();

    if (existingEvent) {
      return new Response(JSON.stringify({ error: 'Referral already processed' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Calculate points
    let pointsToAward = POINTS_MAP[body.event_type] ?? 0;

    if (body.event_type === 'sale' && body.sale_amount) {
      // For sale referrals, default to 5% of sale as points (1pt/$)
      pointsToAward = Math.floor(body.sale_amount * 0.05);
    }

    // 5. Create referral event
    const { data: referralEvent, error: eventError } = await serviceClient
      .from('referral_events')
      .insert({
        referrer_id: referralLink.user_id,
        referred_id: body.referred_user_id,
        type: body.event_type,
        amount: body.sale_amount ?? 0,
        points_awarded: pointsToAward,
        status: 'completed',
      })
      .select()
      .single();

    if (eventError) throw new Error(eventError.message);

    // 6. Award points to referrer
    if (pointsToAward > 0) {
      await serviceClient.rpc('award_points', {
        p_user_id: referralLink.user_id,
        p_amount: pointsToAward,
        p_type: 'referral',
        p_reference_id: referralEvent.id,
        p_reference_type: 'referral',
        p_description: `Referral reward: ${body.event_type.replace('_', ' ')}`,
      });
    }

    // 7. Update referral link stats
    await serviceClient
      .from('referral_links')
      .update({
        conversions: serviceClient.rpc('increment', { x: 1 }),
        earnings: serviceClient.rpc('increment_by', { x: pointsToAward }),
      })
      .eq('id', referralLink.id);

    // 8. Update referred user's referred_by if this is a signup event
    if (['user_signup', 'business_signup'].includes(body.event_type)) {
      await serviceClient
        .from('profiles')
        .update({ referred_by: referralLink.user_id })
        .eq('id', body.referred_user_id)
        .is('referred_by', null);
    }

    return new Response(
      JSON.stringify({
        success: true,
        referral_event_id: referralEvent.id,
        referrer_id: referralLink.user_id,
        points_awarded: pointsToAward,
        event_type: body.event_type,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('process-referral error:', err);
    return new Response(
      JSON.stringify({ error: err.message ?? 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
