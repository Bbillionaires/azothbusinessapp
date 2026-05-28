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

async function verifyEventOwnership(supabase: Awaited<ReturnType<typeof getSupabase>>, eventId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('events')
    .select('organizer_id')
    .eq('id', eventId)
    .single()
  return !!data && data.organizer_id === userId
}

const ALLOWED_PATCH_FIELDS = [
  'title', 'description', 'start_at', 'end_at', 'address', 'city', 'state',
  'max_attendees', 'is_free', 'price', 'type', 'image_url', 'points_reward', 'status',
]

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owned = await verifyEventOwnership(supabase, params.id, user.id)
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const filtered = Object.fromEntries(
    Object.entries(body).filter(([k]) => ALLOWED_PATCH_FIELDS.includes(k))
  )

  const { data, error } = await supabase
    .from('events')
    .update({ ...filtered, updated_at: new Date().toISOString() })
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

  const owned = await verifyEventOwnership(supabase, params.id, user.id)
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('events').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
