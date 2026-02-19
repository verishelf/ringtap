import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Creates a profile for a newly signed-up user. Requires valid session.
 * Generates a unique username (user_xxx) so they can log in to the app and customize later.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
  }

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? '').replace(/^["'\s]+|["'\s]+$/g, '');
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').replace(/^["']|["']$/g, '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').replace(/^["']|["']$/g, '').trim();
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server missing Supabase config' }, { status: 500 });
  }

  const supabaseAnon = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: userError } = await supabaseAnon.auth.getUser(token);
  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // Check if profile already exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return NextResponse.json({ ok: true, profile_id: existing.id });
  }

  // Generate unique username: user_<first 8 chars of user id>
  const baseUsername = `user_${user.id.replace(/-/g, '').slice(0, 8)}`;
  let username = baseUsername;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const { data: conflict } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', username)
      .single();

    if (!conflict) break;
    username = `${baseUsername}${attempts}`;
    attempts++;
  }

  const defaultTheme = {
    accentColor: '#0a7ea4',
    backgroundGradient: ['#1a1a2e', '#16213e'],
    buttonShape: 'rounded' as const,
    typography: 'sans' as const,
  };

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert({
      user_id: user.id,
      username: username.toLowerCase(),
      name: '',
      title: '',
      bio: '',
      email: user.email ?? '',
      theme: defaultTheme,
    })
    .select('id, username')
    .single();

  if (insertError) {
    console.error('[profile/create]', insertError);
    return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profile_id: inserted.id, username: inserted.username });
}
