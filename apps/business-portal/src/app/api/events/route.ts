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

// GET /api/events?business_id=... — list events for the business
export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = buildSupabaseClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const businessId = req.nextUrl.searchParams.get('business_id')
  if (!businessId) return NextResponse.json({ error: 'business_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('business_id', businessId)
    .order('start_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
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
    is_free,
    price,
    event_type,
    image_url,
    points_reward,
  } = body as {
    title?: string
    description?: string
    date?: string
    time?: string
    end_time?: string
    location?: string
    capacity?: number
    is_free?: boolean
    price?: number
    event_type?: string
    image_url?: string
    points_reward?: number
  }

  if (!title || !date || !time) {
    return NextResponse.json(
      { error: 'title, date, and time are required' },
      { status: 400 }
    )
  }

  const startAt = new Date(`${date}T${time}`).toISOString()
  const endAt = end_time ? new Date(`${date}T${end_time}`).toISOString() : null

  const { data, error } = await supabase
    .from('events')
    .insert({
      business_id,
      organizer_id: user.id,
      title,
      description: description ?? null,
      start_at: startAt,
      end_at: endAt,
      address: location ?? null,
      max_attendees: capacity ?? null,
      is_free: is_free ?? true,
      price: price ?? null,
      type: event_type ?? 'community',
      image_url: image_url ?? null,
      points_reward: points_reward ?? 0,
      status: 'published',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ event: data }, { status: 201 })
}
