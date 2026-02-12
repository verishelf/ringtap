import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
    }

    let body: { contact_user_id?: string; name?: string; phone?: string; email?: string; display_name?: string; avatar_url?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const contactUserId = body.contact_user_id?.trim();
    if (!contactUserId) {
      return NextResponse.json({ error: 'Missing contact_user_id' }, { status: 400 });
    }

    const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '')
      .replace(/^["'\s]+|["'\s]+$/g, '')
      .trim();
    let supabaseUrl = rawUrl;
    if (supabaseUrl && !/^https?:\/\//i.test(supabaseUrl)) {
      supabaseUrl = 'https://' + supabaseUrl;
    }
    const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/^["']|["']$/g, '').trim();
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { error: 'Server missing Supabase config' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const name = (body.name ?? '').trim();
    const phone = (body.phone ?? '').trim() || null;
    const email = (body.email ?? '').trim() || null;

    const { error: exchangeError } = await supabase.from('contact_exchanges').insert({
      from_user_id: user.id,
      to_user_id: contactUserId,
      name: name || 'Unknown',
      phone,
      email,
    });
    if (exchangeError) {
      return NextResponse.json(
        { error: exchangeError.message || 'Failed to exchange contact' },
        { status: 400 }
      );
    }

    const displayName = (body.display_name ?? '').trim();
    const avatarUrl = typeof body.avatar_url === 'string' ? body.avatar_url.trim() || null : null;

    const { error: insertError } = await supabase.from('user_contacts').insert({
      owner_id: user.id,
      contact_user_id: contactUserId,
      display_name: displayName,
      avatar_url: avatarUrl,
    });

    if (insertError && insertError.code !== '23505') {
      return NextResponse.json(
        { error: insertError.message || 'Failed to save contact' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Exchange contact error: ${message}` },
      { status: 500 }
    );
  }
}
