import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getAuthAndBusiness(offerId: string) {
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
  if (!user) return { supabase, user: null, offer: null, authorized: false };

  const { data: offer } = await supabase
    .from('business_offers')
    .select('id, business_id, businesses!inner(owner_id)')
    .eq('id', offerId)
    .single();

  const authorized = offer && (offer.businesses as any).owner_id === user.id;
  return { supabase, user, offer, authorized };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, authorized } = await getAuthAndBusiness(params.id);
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const updates = await req.json();
  const allowed = ['title','description','offer_type','discount_percent','discount_amount',
    'promo_code','terms','starts_at','expires_at','max_redemptions','points_bonus','image_url','is_active'];
  const filtered = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)));

  const { data, error } = await supabase
    .from('business_offers')
    .update(filtered)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, authorized } = await getAuthAndBusiness(params.id);
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { error } = await supabase.from('business_offers').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
