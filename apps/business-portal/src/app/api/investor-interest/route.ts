import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const service = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { business_id, investor_name, investor_email, investor_phone, message, opportunity_type } = body;

  if (!business_id || !investor_name || !investor_email) {
    return NextResponse.json({ error: 'business_id, name, and email are required' }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(investor_email)) {
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
  }

  const { data, error } = await service
    .from('investor_interest')
    .insert({ business_id, investor_name, investor_email, investor_phone, message, opportunity_type: opportunity_type ?? 'partnership' })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id: data.id }, { status: 201 });
}
