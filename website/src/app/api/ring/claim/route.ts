import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  let body: { uid?: string; user_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const uid = body.uid?.trim();
  const userId = body.user_id?.trim();
  if (!uid || !userId) {
    return NextResponse.json({ error: 'Missing uid or user_id' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: existing } = await supabase
    .from('rings')
    .select('status, owner_user_id')
    .eq('chip_uid', uid)
    .single();

  if (existing?.status === 'claimed' && existing.owner_user_id) {
    return NextResponse.json(
      { error: 'Ring already claimed', owner_user_id: existing.owner_user_id },
      { status: 409 }
    );
  }

  const { error: upsertError } = await supabase
    .from('rings')
    .upsert(
      {
        chip_uid: uid,
        owner_user_id: userId,
        status: 'claimed',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'chip_uid' }
    );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, status: 'claimed' });
}
