import { corsHeaders } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const body = await req.text();

  // Verify Stripe webhook signature
  let event: any;
  try {
    event = await verifyStripeWebhook(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const serviceClient = getServiceClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(event.data.object, serviceClient);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await handleSubscriptionUpdated(event.data.object, serviceClient);
        break;
      }
      case 'customer.subscription.deleted': {
        await handleSubscriptionCancelled(event.data.object, serviceClient);
        break;
      }
      case 'invoice.payment_succeeded': {
        await handleInvoicePaid(event.data.object, serviceClient);
        break;
      }
      case 'invoice.payment_failed': {
        await handleInvoiceFailed(event.data.object, serviceClient);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    return new Response(`Handler error: ${err.message}`, { status: 500 });
  }
});

async function handleCheckoutCompleted(session: any, supabase: any) {
  const { metadata } = session;
  if (!metadata) return;

  const { type, business_id, user_id } = metadata;

  if (type === 'greenwood_verification') {
    const level = metadata.verification_level;

    // Update business verification level
    await supabase
      .from('businesses')
      .update({
        verification_level: level,
        updated_at: new Date().toISOString(),
      })
      .eq('id', business_id);

    // Create verification request record (mark as approved)
    await supabase
      .from('business_verification_requests')
      .insert({
        business_id,
        level,
        status: 'payment_received',
        documents: {},
        notes: `Payment received via Stripe. Session: ${session.id}`,
      });

    // Trigger referral commission if business was referred
    const { data: biz } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('id', business_id)
      .single();

    if (biz) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('referred_by, referral_code')
        .eq('id', biz.owner_id)
        .single();

      if (profile?.referred_by) {
        await supabase.functions.invoke('process-referral', {
          body: {
            referral_code: profile.referral_code,
            event_type: 'greenwood_purchase',
            referred_user_id: biz.owner_id,
          },
        });
      }
    }
  }

  if (type === 'premium_membership') {
    await supabase
      .from('profiles')
      .update({ tier: 'gold', updated_at: new Date().toISOString() })
      .eq('id', user_id);
  }

  if (type === 'ad_campaign') {
    const { campaign_id } = metadata;
    await supabase
      .from('ad_campaigns')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', campaign_id);
  }
}

async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  const { metadata } = subscription;
  if (!metadata?.business_id) return;

  const isActive = subscription.status === 'active';
  const level = metadata.verification_level;

  await supabase
    .from('businesses')
    .update({
      verification_level: isActive ? level : 'none',
      updated_at: new Date().toISOString(),
    })
    .eq('id', metadata.business_id);
}

async function handleSubscriptionCancelled(subscription: any, supabase: any) {
  const { metadata } = subscription;
  if (!metadata?.business_id) return;

  await supabase
    .from('businesses')
    .update({
      verification_level: 'none',
      updated_at: new Date().toISOString(),
    })
    .eq('id', metadata.business_id);
}

async function handleInvoicePaid(invoice: any, supabase: any) {
  console.log('Invoice paid:', invoice.id, '$' + invoice.amount_paid / 100);
}

async function handleInvoiceFailed(invoice: any, supabase: any) {
  const { metadata } = invoice;
  if (metadata?.business_id) {
    // Grace period: don't immediately downgrade, send notification
    console.log('Payment failed for business:', metadata.business_id);
  }
}

// Minimal Stripe webhook signature verification for Deno
async function verifyStripeWebhook(
  payload: string,
  signature: string,
  secret: string
): Promise<any> {
  const parts = signature.split(',').reduce((acc: any, part) => {
    const [key, value] = part.split('=');
    acc[key] = value;
    return acc;
  }, {});

  const timestamp = parts['t'];
  const expectedSig = parts['v1'];

  if (!timestamp || !expectedSig) throw new Error('Invalid signature format');

  // Verify timestamp is within 5 minutes
  const fiveMinutes = 5 * 60;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > fiveMinutes) {
    throw new Error('Webhook timestamp too old');
  }

  const signedPayload = `${timestamp}.${payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(signedPayload)
  );

  const computedSig = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  if (computedSig !== expectedSig) {
    throw new Error('Signature mismatch');
  }

  return JSON.parse(payload);
}
