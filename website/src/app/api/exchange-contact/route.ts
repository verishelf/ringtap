import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Mutual contact exchange: when user A adds user B, both get each other as contacts.
 * Requires Bearer token (user A). Uses service role to insert both rows (RLS blocks
 * user A from inserting into user B's contact list).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
    }

    let body: { contact_user_id?: string; display_name?: string; avatar_url?: string };
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
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/^["']|["']$/g, '').trim();
    if (!supabaseUrl || !anonKey || !serviceKey) {
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

    const requesterId = user.id;
    if (requesterId === contactUserId) {
      return NextResponse.json({ error: 'Cannot exchange with yourself' }, { status: 400 });
    }

    const displayName = typeof body.display_name === 'string' ? body.display_name.trim() : '';
    const avatarUrl = typeof body.avatar_url === 'string' ? body.avatar_url.trim() || null : null;

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Fetch requester's profile for the reverse contact (B's list gets A's name/avatar)
    let requesterDisplayName = '';
    let requesterAvatarUrl: string | null = null;
    const { data: requesterProfile } = await supabaseAdmin
      .from('profiles')
      .select('name, avatar_url')
      .eq('user_id', requesterId)
      .single();
    if (requesterProfile) {
      if (!requesterDisplayName && requesterProfile.name) {
        requesterDisplayName = String(requesterProfile.name).trim();
      }
      if (!requesterAvatarUrl && requesterProfile.avatar_url) {
        requesterAvatarUrl = String(requesterProfile.avatar_url).trim();
      }
    }

    // Fetch contact's profile for requester's list (A's list gets B's name/avatar)
    let contactDisplayName = displayName;
    let contactAvatarUrl = avatarUrl;
    const { data: contactProfile } = await supabaseAdmin
      .from('profiles')
      .select('name, avatar_url')
      .eq('user_id', contactUserId)
      .single();
    if (contactProfile) {
      contactDisplayName = String(contactProfile.name || '').trim() || contactDisplayName;
      contactAvatarUrl = String(contactProfile.avatar_url || '').trim() || contactAvatarUrl;
    }

    // Insert both rows; ignore unique violation (already saved)
    const { error: err1 } = await supabaseAdmin.from('user_contacts').insert({
      owner_id: requesterId,
      contact_user_id: contactUserId,
      display_name: contactDisplayName,
      avatar_url: contactAvatarUrl,
    });
    if (err1 && err1.code !== '23505') {
      return NextResponse.json({ error: err1.message || 'Failed to save contact' }, { status: 400 });
    }

    const { error: err2 } = await supabaseAdmin.from('user_contacts').insert({
      owner_id: contactUserId,
      contact_user_id: requesterId,
      display_name: requesterDisplayName,
      avatar_url: requesterAvatarUrl,
    });
    if (err2 && err2.code !== '23505') {
      return NextResponse.json({ error: err2.message || 'Failed to exchange contact' }, { status: 400 });
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
