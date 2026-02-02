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

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, user_id, username, name, title, bio, avatar_url, video_intro_url, email, phone, website, theme, custom_buttons, social_links')
    .eq('user_id', uid.trim())
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

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
  });
}
