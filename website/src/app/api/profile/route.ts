import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

type ProfileRow = {
  id: string;
  user_id: string;
  username: string;
  name: string;
  title: string;
  bio: string;
  avatar_url: string | null;
  email: string;
  phone: string;
  website: string;
  social_links: Record<string, string>;
};

export async function GET(request: NextRequest) {
  const uid = request.nextUrl.searchParams.get('uid');
  const username = request.nextUrl.searchParams.get('username');
  if (!uid?.trim() && !username?.trim()) {
    return NextResponse.json({ error: 'Missing uid or username' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !(anonKey || serviceKey)) {
    return NextResponse.json({ error: 'Server missing Supabase config' }, { status: 500 });
  }
  const supabase = createClient(supabaseUrl, serviceKey || anonKey!);

  let profile: ProfileRow | null = null;
  let profileError: unknown = null;

  if (username?.trim()) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, username, name, title, bio, avatar_url, video_intro_url, email, phone, website, theme, custom_buttons, social_links')
      .eq('username', username.trim().toLowerCase())
      .maybeSingle();
    profile = data as ProfileRow | null;
    profileError = error;
  } else if (uid?.trim()) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, username, name, title, bio, avatar_url, video_intro_url, email, phone, website, theme, custom_buttons, social_links')
      .eq('user_id', uid.trim())
      .single();
    profile = data as ProfileRow | null;
    profileError = error;
  }

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const userId = profile.user_id;

  // Fetch user's links for public profile (service role can read; anon needs RLS "public read links")
  let links: { id: string; title: string; url: string; type: string; sort_order: number }[] = [];
  const { data: linksData } = await supabase
    .from('links')
    .select('id, title, url, type, sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });
  if (Array.isArray(linksData)) links = linksData;

  return NextResponse.json({
    id: profile.id,
    username: profile.username,
    name: profile.name,
    title: profile.title,
    bio: profile.bio,
    avatar_url: profile.avatar_url,
    email: profile.email,
    phone: profile.phone,
    website: profile.website,
    social_links: profile.social_links ?? {},
    links,
  });
}
