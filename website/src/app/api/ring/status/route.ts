import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get('uid');
  if (!uid?.trim()) {
    return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    return NextResponse.json({ error: 'Server missing SUPABASE_URL' }, { status: 500 });
  }
  // Prefer service role so we can always read ring status (e.g. after /api/activate created the ring)
  const key = serviceRoleKey || anonKey;
  if (!key) {
    return NextResponse.json({ error: 'Server missing Supabase key' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, key);

  let { data: ring, error } = await supabase
    .from('rings')
    .select('chip_uid, ring_model, owner_user_id, status')
    .eq('chip_uid', uid.trim())
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If ring not found and we have service role, create it (same as /api/activate) so claim flow works
  if (!ring && serviceRoleKey) {
    const { error: insertErr } = await supabase.from('rings').insert({
      chip_uid: uid.trim(),
      status: 'unclaimed',
    });
    if (!insertErr) {
      const { data: created } = await supabase
        .from('rings')
        .select('chip_uid, ring_model, owner_user_id, status')
        .eq('chip_uid', uid.trim())
        .single();
      ring = created ?? undefined;
    }
  }

  const ringModelId = ring?.ring_model ?? 'onyx_black';
  const { data: model } = await supabase
    .from('ring_models')
    .select('id, name, model_url, thumbnail_url')
    .eq('id', ringModelId)
    .single();

  const modelUrl = model?.model_url ?? null;

  return NextResponse.json({
    status: ring?.status ?? 'unclaimed',
    chip_uid: uid.trim(),
    ring_model: ring?.ring_model ?? ringModelId,
    model_url: modelUrl,
    owner_user_id: ring?.owner_user_id ?? null,
  });
}
