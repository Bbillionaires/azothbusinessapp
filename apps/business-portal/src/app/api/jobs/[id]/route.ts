import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )
}

async function verifyJobOwnership(supabase: Awaited<ReturnType<typeof getSupabase>>, jobId: string, userId: string) {
  const { data: job } = await supabase
    .from('job_postings')
    .select('business_id')
    .eq('id', jobId)
    .single()
  if (!job) return false
  const { data: biz } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', job.business_id)
    .eq('owner_id', userId)
    .single()
  return !!biz
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owns = await verifyJobOwnership(supabase, params.id, user.id)
  if (!owns) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id: _id, business_id: _bid, created_at: _ca, ...safeUpdates } = body
  void _id; void _bid; void _ca

  const { data, error } = await supabase
    .from('job_postings')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owns = await verifyJobOwnership(supabase, params.id, user.id)
  if (!owns) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('job_postings').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
