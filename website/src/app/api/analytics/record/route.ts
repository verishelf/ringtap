import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const VALID_TYPES = ['profile_view', 'link_click', 'nfc_tap', 'qr_scan'] as const;

export async function POST(request: NextRequest) {
  try {
    let body: { profile_id?: string; username?: string; type?: string; link_id?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const type = body.type?.trim();
    if (!type || !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
      return NextResponse.json({ error: 'Invalid or missing type' }, { status: 400 });
    }

    const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '')
      .replace(/^["'\s]+|["'\s]+$/g, '')
      .trim();
    let supabaseUrl = rawUrl;
    if (supabaseUrl && !/^https?:\/\//i.test(supabaseUrl)) supabaseUrl = 'https://' + supabaseUrl;
    const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/^["']|["']$/g, '').trim();
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Server missing Supabase config' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, anonKey);

    let profileId: string | null = body.profile_id?.trim() || null;
    if (!profileId && body.username?.trim()) {
      const slug = body.username.trim().toLowerCase();
      const { data: row } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', slug)
        .maybeSingle();
      profileId = (row as { id?: string } | null)?.id ?? null;
    }
    if (!profileId) {
      return NextResponse.json({ error: 'Missing profile_id or username' }, { status: 400 });
    }

    const linkId = body.link_id?.trim() || null;
    const { error: insertError } = await supabase.from('analytics_events').insert({
      profile_id: profileId,
      type,
      link_id: linkId,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
