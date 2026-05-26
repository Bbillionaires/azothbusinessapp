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

// POST /api/events — create an event (user must own the business)
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

  const { business_id } = body as { business_id?: string }

  if (!business_id) {
    return NextResponse.json({ error: 'business_id is required' }, { status: 400 })
  }

  // Verify user owns this business
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', business_id)
    .eq('owner_id', user.id)
    .single()

  if (bizError || !business) {
    return NextResponse.json({ error: 'Business not found or access denied' }, { status: 404 })
  }

  const {
    title,
    description,
    date,
    time,
    end_time,
    location,
    capacity,
    price_type,
    price,
    category,
    image_url,
  } = body as {
    title?: string
    description?: string
    date?: string
    time?: string
    end_time?: string
    location?: string
    capacity?: number
    price_type?: 'free' | 'paid'
    price?: number
    category?: string
    image_url?: string
  }

  if (!title || !date || !time || !location) {
    return NextResponse.json(
      { error: 'title, date, time, and location are required' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('events')
    .insert({
      business_id,
      title,
      description: description ?? null,
      date,
      time,
      end_time: end_time ?? null,
      location,
      capacity: capacity ?? null,
      price_type: price_type ?? 'free',
      price: price ?? null,
      category: category ?? null,
      image_url: image_url ?? null,
      status: 'published',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ event: data }, { status: 201 })
}
