import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

import { sendInternalContactPush } from '@/lib/internalContactPush';

/**
 * Connect flow: viewer (Sarah) signs up via profile page, gets added to profile owner's (Frank's) contacts.
 * Called from auth callback after signInWithOtp. Uses service role to insert into owner's contacts (RLS blocks user from inserting into another user's list).
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace(/Bearer\s+/i, '').trim();
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
    }

    let body: { owner_id?: string };
    try {
      body = (await request.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const ownerId = body.owner_id?.trim();
    if (!ownerId || !/^[0-9a-f-]{36}$/i.test(ownerId)) {
      return NextResponse.json({ error: 'Missing or invalid owner_id' }, { status: 400 });
    }

    const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '')
      .replace(/^["'\s]+|["'\s]+$/g, '')
      .trim();
    const supabaseUrl = rawUrl && !/^https?:\/\//i.test(rawUrl) ? 'https://' + rawUrl : rawUrl;
    const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/^["']|["']$/g, '').trim();
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/^["']|["']$/g, '').trim();
    if (!supabaseUrl || !anonKey || !serviceKey) {
      return NextResponse.json({ error: 'Server missing Supabase config' }, { status: 500 });
    }

    const supabaseAnon = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const viewerId = user.id;
    if (viewerId === ownerId) {
      return NextResponse.json({ success: true, message: 'Already connected' });
    }

    // Verify owner has a profile (prevents arbitrary user_id injection)
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    const { data: ownerProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, name, avatar_url')
      .eq('user_id', ownerId)
      .single();

    if (!ownerProfile) {
      return NextResponse.json({ error: 'Profile owner not found' }, { status: 404 });
    }

    // Get viewer's profile for display_name/avatar
    let displayName = '';
    let avatarUrl: string | null = null;
    const { data: viewerProfile } = await supabaseAdmin
      .from('profiles')
      .select('name, avatar_url')
      .eq('user_id', viewerId)
      .single();
    if (viewerProfile) {
      displayName = String(viewerProfile.name || '').trim();
      avatarUrl = viewerProfile.avatar_url ? String(viewerProfile.avatar_url).trim() : null;
    }

    const { error: insertError } = await supabaseAdmin.from('user_contacts').insert({
      owner_id: ownerId,
      contact_user_id: viewerId,
      display_name: displayName,
      avatar_url: avatarUrl,
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ success: true, message: 'Already connected' });
      }
      return NextResponse.json(
        { error: insertError.message || 'Failed to connect' },
        { status: 400 }
      );
    }

    const viewerLabel = displayName || 'Someone new';
    await sendInternalContactPush(supabaseUrl, ownerId, {
      title: 'New contact',
      body: `${viewerLabel} connected from your profile`,
      data: {
        type: 'contact',
        kind: 'profile_connect',
        fromUserId: viewerId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Connect error: ${message}` },
      { status: 500 }
    );
  }
}
