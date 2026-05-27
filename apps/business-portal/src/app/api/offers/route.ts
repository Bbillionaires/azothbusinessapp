import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const businessId = req.nextUrl.searchParams.get('business_id');
  if (!businessId) return NextResponse.json({ error: 'business_id required' }, { status: 400 });

  const { data, error } = await supabase
    .from('business_offers')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { business_id, title, description, offer_type, discount_percent, discount_amount,
    promo_code, terms, starts_at, expires_at, max_redemptions, points_bonus, image_url } = body;

  if (!business_id || !title) {
    return NextResponse.json({ error: 'business_id and title are required' }, { status: 400 });
  }

  // Verify ownership
  const { data: biz } = await supabase.from('businesses').select('id').eq('id', business_id).eq('owner_id', user.id).single();
  if (!biz) return NextResponse.json({ error: 'Business not found or unauthorized' }, { status: 403 });

  const { data, error } = await supabase
    .from('business_offers')
    .insert({
      business_id, title, description, offer_type: offer_type ?? 'discount',
      discount_percent, discount_amount, promo_code, terms,
      starts_at: starts_at ?? new Date().toISOString(),
      expires_at, max_redemptions, points_bonus: points_bonus ?? 0,
      image_url, is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
