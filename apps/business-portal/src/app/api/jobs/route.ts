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

// POST /api/jobs — create a job posting (user must own the business)
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
    employment_type,
    location,
    salary_min,
    salary_max,
    salary_period,
    requirements,
    benefits,
    application_url,
    application_email,
    closes_at,
  } = body as {
    title?: string
    description?: string
    employment_type?: string
    location?: string
    salary_min?: number
    salary_max?: number
    salary_period?: string
    requirements?: string
    benefits?: string
    application_url?: string
    application_email?: string
    closes_at?: string
  }

  if (!title || !description) {
    return NextResponse.json({ error: 'title and description are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('job_postings')
    .insert({
      business_id,
      title,
      description,
      employment_type: employment_type ?? null,
      location: location ?? null,
      salary_min: salary_min ?? null,
      salary_max: salary_max ?? null,
      salary_period: salary_period ?? null,
      requirements: requirements ?? null,
      benefits: benefits ?? null,
      application_url: application_url ?? null,
      application_email: application_email ?? null,
      closes_at: closes_at ?? null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ job: data }, { status: 201 })
}
