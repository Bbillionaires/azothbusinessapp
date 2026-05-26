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

// POST /api/reviews/[id]/respond — add or update a business owner's response to a review
export async function POST(req: NextRequest, { params }: RouteParams) {
  const { id: reviewId } = await params
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

  const { response_text } = body as { response_text?: string }

  if (!response_text || typeof response_text !== 'string' || response_text.trim().length === 0) {
    return NextResponse.json({ error: 'response_text is required' }, { status: 400 })
  }

  // Fetch the review and verify the user owns the business it belongs to
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .select('id, business_id')
    .eq('id', reviewId)
    .single()

  if (reviewError || !review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 })
  }

  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id')
    .eq('id', review.business_id)
    .eq('owner_id', user.id)
    .single()

  if (bizError || !business) {
    return NextResponse.json({ error: 'Access denied — you do not own this business' }, { status: 403 })
  }

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('review_responses')
    .upsert(
      {
        review_id: reviewId,
        business_id: review.business_id,
        response_text: response_text.trim(),
        responded_by: user.id,
        updated_at: now,
      },
      {
        onConflict: 'review_id',
      }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ response: data })
}
