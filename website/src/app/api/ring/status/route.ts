import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get('uid');
  if (!uid?.trim()) {
    return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: ring, error } = await supabase
    .from('rings')
    .select('chip_uid, ring_model, owner_user_id, status')
    .eq('chip_uid', uid.trim())
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
