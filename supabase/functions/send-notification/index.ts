import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { getServiceClient } from '../_shared/supabase.ts';

interface SendNotificationRequest {
  user_id?: string;
  user_ids?: string[];
  topic?: string; // for broadcast (e.g. 'city_jacksonville')
  title: string;
  body: string;
  data?: Record<string, string>;
  type: 'receipt_approved' | 'receipt_rejected' | 'points_earned' | 'event_reminder' | 'job_match' | 'referral_earned' | 'badge_earned' | 'ad_push' | 'generic';
}

Deno.serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const serviceClient = getServiceClient();

  let body: SendNotificationRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const fcmServerKey = Deno.env.get('FIREBASE_SERVER_KEY');
    if (!fcmServerKey) throw new Error('Firebase server key not configured');

    // Gather FCM tokens
    let tokens: string[] = [];

    if (body.user_id) {
      const { data } = await serviceClient
        .from('user_settings')
        .select('fcm_token')
        .eq('user_id', body.user_id)
        .eq('push_notifications', true)
        .not('fcm_token', 'is', null);
      tokens = (data ?? []).map((d: any) => d.fcm_token);
    }

    if (body.user_ids && body.user_ids.length > 0) {
      const { data } = await serviceClient
        .from('user_settings')
        .select('fcm_token')
        .in('user_id', body.user_ids)
        .eq('push_notifications', true)
        .not('fcm_token', 'is', null);
      tokens = (data ?? []).map((d: any) => d.fcm_token);
    }

    const results = { sent: 0, failed: 0, errors: [] as string[] };

    // Send to individual tokens
    if (tokens.length > 0) {
      // FCM v1 API supports up to 500 tokens per batch
      const batches = [];
      for (let i = 0; i < tokens.length; i += 500) {
        batches.push(tokens.slice(i, i + 500));
      }

      for (const batch of batches) {
        const fcmPayload = {
          registration_ids: batch,
          notification: {
            title: body.title,
            body: body.body,
            sound: 'default',
            badge: '1',
          },
          data: {
            type: body.type,
            ...(body.data ?? {}),
          },
          android: {
            priority: 'high',
            notification: {
              channel_id: 'local_first_rewards',
              icon: 'ic_notification',
              color: '#1B4332',
            },
          },
          apns: {
            headers: { 'apns-priority': '10' },
            payload: {
              aps: {
                alert: { title: body.title, body: body.body },
                badge: 1,
                sound: 'default',
              },
            },
          },
        };

        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
          method: 'POST',
          headers: {
            Authorization: `key=${fcmServerKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fcmPayload),
        });

        const result = await response.json();
        results.sent += result.success ?? 0;
        results.failed += result.failure ?? 0;
      }
    }

    // Topic broadcast (e.g. city-wide push ads)
    if (body.topic) {
      const fcmPayload = {
        to: `/topics/${body.topic}`,
        notification: { title: body.title, body: body.body },
        data: { type: body.type, ...(body.data ?? {}) },
      };

      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          Authorization: `key=${fcmServerKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fcmPayload),
      });

      const result = await response.json();
      if (result.message_id) results.sent += 1;
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
