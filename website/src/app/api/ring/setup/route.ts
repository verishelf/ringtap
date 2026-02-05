import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * QR setup flow: authenticated user claims a ring by setup ID (chip_uid).
 * Requires Authorization: Bearer <supabase_jwt>. Creates ring if missing, then claims.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
    }

    let body: { setup_id?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const setupId = body.setup_id?.trim();
    if (!setupId) {
      return NextResponse.json({ error: 'Missing setup_id' }, { status: 400 });
    }

    const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '')
      .replace(/^["'\s]+|["'\s]+$/g, '')
      .trim();
    let supabaseUrl = rawUrl;
    if (supabaseUrl && !/^https?:\/\//i.test(supabaseUrl)) {
      supabaseUrl = 'https://' + supabaseUrl;
    }
    const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/^["']|["']$/g, '').trim();
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/^["']|["']$/g, '').trim();
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Server missing Supabase config' },
        { status: 500 }
      );
    }

    const supabaseAnon = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: existing } = await supabase
      .from('rings')
      .select('status, owner_user_id')
      .eq('chip_uid', setupId)
      .single();

    if (existing?.status === 'claimed' && existing.owner_user_id) {
      if (existing.owner_user_id === user.id) {
        return NextResponse.json({ success: true, already_linked: true });
      }
      return NextResponse.json(
        { error: 'This ring is already linked to another account' },
        { status: 409 }
      );
    }

    const { error: upsertError } = await supabase
      .from('rings')
      .upsert(
        {
          chip_uid: setupId,
          owner_user_id: user.id,
          status: 'claimed',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'chip_uid' }
      );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, already_linked: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Setup error: ${message}` },
      { status: 500 }
    );
  }
}
