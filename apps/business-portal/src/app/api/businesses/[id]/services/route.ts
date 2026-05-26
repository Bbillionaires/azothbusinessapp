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
        setAll(cookiesToSet) {
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

// GET /api/businesses/[id]/services — list services for a business
export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = buildSupabaseClient(cookieStore)

  const { data, error } = await supabase
    .from('business_services')
    .select('id, name, description, price, duration_minutes, created_at')
    .eq('business_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ services: data ?? [] })
}

// POST /api/businesses/[id]/services — add a service (ownership verified)
export async function POST(req: NextRequest, { params }: RouteParams) {
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
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (bizError || !business) {
    return NextResponse.json({ error: 'Business not found or access denied' }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { name, description, price, duration_minutes } = body as {
    name?: string
    description?: string | null
    price?: number | null
    duration_minutes?: number | null
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('business_services')
    .insert({
      business_id: id,
      name: name.trim(),
      description: description?.trim() ?? null,
      price: price != null ? Number(price) : null,
      duration_minutes: duration_minutes != null ? Math.round(Number(duration_minutes)) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, name, description, price, duration_minutes, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ service: data }, { status: 201 })
}
