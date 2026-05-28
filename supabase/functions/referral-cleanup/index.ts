import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Scheduled function (runs daily via cron) that:
 * 1. Recalculates successful_referrals count and total_earned on referral_links
 * 2. Expires old referral marketplace entries that have passed their expiry date
 * 3. Awards any pending referral bonuses that have not yet been processed
 */
serve(async (req) => {
  // Validate cron secret
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const results: Record<string, any> = {}
  const now = new Date().toISOString()

  // -----------------------------------------------------------------------
  // 1. Recalculate referral_links stats: successful_referrals + total_earned
  // -----------------------------------------------------------------------
  const { data: links, error: linksError } = await supabase
    .from('referral_links')
    .select('id, user_id')

  if (linksError) {
    console.error('Failed to fetch referral links:', linksError.message)
    return new Response(JSON.stringify({ error: linksError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let linksUpdated = 0
  for (const link of links ?? []) {
    const { data: events } = await supabase
      .from('referral_events')
      .select('points_awarded')
      .eq('referrer_id', link.user_id)
      .eq('status', 'completed')

    const successfulReferrals = events?.length ?? 0
    const totalEarned = (events ?? []).reduce(
      (sum: number, e: any) => sum + (e.points_awarded ?? 0),
      0
    )

    const { error: updateError } = await supabase
      .from('referral_links')
      .update({
        conversions: successfulReferrals,
        earnings: totalEarned,
        updated_at: now,
      })
      .eq('id', link.id)

    if (updateError) {
      console.error(`Failed to update link ${link.id}:`, updateError.message)
    } else {
      linksUpdated++
    }
  }
  results.links_recalculated = linksUpdated

  // -----------------------------------------------------------------------
  // 2. Expire old referral marketplace programs that have passed expiry date
  // -----------------------------------------------------------------------
  const { data: expiredPrograms, error: expireError } = await supabase
    .from('referral_marketplace')
    .update({ is_active: false, updated_at: now })
    .eq('is_active', true)
    .not('ends_at', 'is', null)
    .lt('ends_at', now)
    .select('id, title')

  if (expireError) {
    console.error('Failed to expire marketplace programs:', expireError.message)
    results.programs_expired_error = expireError.message
  } else {
    results.programs_expired = expiredPrograms?.length ?? 0
    console.log(`Expired ${expiredPrograms?.length ?? 0} referral marketplace programs`)
  }

  // -----------------------------------------------------------------------
  // 3. Award any pending referral bonuses
  // -----------------------------------------------------------------------
  const { data: pendingEvents, error: pendingError } = await supabase
    .from('referral_events')
    .select('id, referrer_id, points_awarded')
    .eq('status', 'pending')
    .lte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // at least 1 day old

  if (pendingError) {
    console.error('Failed to fetch pending referral events:', pendingError.message)
    results.pending_bonuses_error = pendingError.message
  } else {
    let bonusesAwarded = 0
    for (const event of pendingEvents ?? []) {
      try {
        if ((event.points_awarded ?? 0) > 0) {
          await supabase.rpc('award_points', {
            p_user_id: event.referrer_id,
            p_amount: event.points_awarded,
            p_type: 'referral',
            p_reference_id: event.id,
            p_reference_type: 'referral',
            p_description: 'Pending referral bonus processed',
          })
        }

        await supabase
          .from('referral_events')
          .update({ status: 'completed' })
          .eq('id', event.id)

        bonusesAwarded++
      } catch (e: any) {
        console.error(`Failed to award bonus for referral event ${event.id}:`, e.message)
      }
    }
    results.pending_bonuses_awarded = bonusesAwarded
    console.log(`Awarded ${bonusesAwarded} pending referral bonuses`)
  }

  return new Response(
    JSON.stringify({ success: true, run_at: now, ...results }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
