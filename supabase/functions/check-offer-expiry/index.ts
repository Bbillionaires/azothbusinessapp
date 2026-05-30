import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  // Validate cron secret
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Deactivate expired offers
  const { data, error } = await supabase
    .from('business_offers')
    .update({ is_active: false })
    .eq('is_active', true)
    .lt('expires_at', new Date().toISOString())
    .select('id, title')

  if (error) {
    console.error('Failed to deactivate expired offers:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log(`Deactivated ${data?.length ?? 0} expired offers`)

  return new Response(JSON.stringify({ deactivated: data?.length ?? 0 }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
