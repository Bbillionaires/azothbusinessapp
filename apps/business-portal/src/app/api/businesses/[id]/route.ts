import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function buildSupabaseClient(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component context — safe to ignore
          }
        },
      },
    }
  )
}

type RouteParams = { params: Promise<{ id: string }> }

// PATCH /api/businesses/[id] — update a business (ownership verified)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = buildSupabaseClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Strip fields that should not be updated directly
  const { id: _id, owner_id: _owner, created_at: _created, ...safeUpdates } = body as Record<string, unknown>
  void _id; void _owner; void _created

  const { data, error } = await supabase
    .from('businesses')
    .update({
      ...safeUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ business: data })
}

// DELETE /api/businesses/[id] — soft-delete (set status = 'closed')
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = buildSupabaseClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('businesses')
    .update({
      status: 'closed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
