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

// GET /api/businesses — list businesses owned by the current user
export async function GET() {
  const cookieStore = await cookies()
  const supabase = buildSupabaseClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ businesses: data })
}

// POST /api/businesses — create a new business for the current user
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = buildSupabaseClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const {
    name,
    description,
    category,
    address,
    city,
    state,
    zip,
    phone,
    website,
    hours,
  } = body as {
    name?: string
    description?: string
    category?: string
    address?: string
    city?: string
    state?: string
    zip?: string
    phone?: string
    website?: string
    hours?: Record<string, { open: string; close: string; closed: boolean }>
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
  }

  // Use service-role client to bypass RLS on insert
  const serviceSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )

  const baseSlug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const { data, error } = await serviceSupabase
    .from('businesses')
    .insert({
      owner_id: user.id,
      name: name.trim(),
      slug,
      description: description ?? null,
      category: category ?? 'other',
      address: address ?? null,
      city: city ?? null,
      state: state ?? null,
      zip: zip ?? null,
      phone: phone ?? null,
      website: website ?? null,
      hours: hours ?? {},
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ business: data }, { status: 201 })
}
