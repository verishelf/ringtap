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
  try {
    const uid = request.nextUrl.searchParams.get('uid');
    const username = request.nextUrl.searchParams.get('username');
    if (!uid?.trim() && !username?.trim()) {
      return NextResponse.json({ error: 'Missing uid or username' }, { status: 400 });
    }

    const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '')
      .replace(/^["'\s]+|["'\s]+$/g, '')
      .replace(/\s+/g, '')
      .trim();
    let supabaseUrl = rawUrl;
    if (supabaseUrl && !/^https?:\/\//i.test(supabaseUrl)) {
      supabaseUrl = 'https://' + supabaseUrl;
    }
    const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/^["']|["']$/g, '').trim();
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/^["']|["']$/g, '').trim();
    if (!supabaseUrl || !(anonKey || serviceKey)) {
      return NextResponse.json(
        { error: 'Server missing Supabase config (check NEXT_PUBLIC_SUPABASE_URL and anon/service key)' },
        { status: 500 }
      );
    }
    if (!/^https?:\/\/[^\s/]+/.test(supabaseUrl)) {
      return NextResponse.json(
        {
          error:
            'Invalid NEXT_PUBLIC_SUPABASE_URL: use your Project URL from Supabase (e.g. https://xxxxx.supabase.co). In Vercel, set it for Production and redeploy.',
        },
        { status: 500 }
      );
    }
    const supabase = createClient(supabaseUrl, serviceKey || anonKey);

    let profile: ProfileRow | null = null;
    let profileError: unknown = null;

    if (username?.trim()) {
      const slug = username.trim().toLowerCase();
      // Case-insensitive lookup: try exact match first, then ilike (handles any stored casing)
      const { data: exact } = await supabase
        .from('profiles')
        .select('id, user_id, username, name, title, bio, avatar_url, video_intro_url, email, phone, website, theme, custom_buttons, social_links')
        .eq('username', slug)
        .maybeSingle();
      if (exact) {
        profile = exact as ProfileRow;
      } else {
        const pattern = slug.replace(/%/g, '\\%').replace(/_/g, '\\_');
        const { data: fuzzy, error: fuzzyErr } = await supabase
          .from('profiles')
          .select('id, user_id, username, name, title, bio, avatar_url, video_intro_url, email, phone, website, theme, custom_buttons, social_links')
          .ilike('username', pattern)
          .maybeSingle();
        profile = fuzzy as ProfileRow | null;
        profileError = fuzzyErr;
      }
      if (!profile) {
        return NextResponse.json(
          {
            error: `No profile with username "${slug}". In the RingTap app: Profile → Edit → set Username to "${slug}" → Save. Ensure the app and website use the same Supabase project.`,
          },
          { status: 404 }
        );
      }
    } else if (uid?.trim()) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, name, title, bio, avatar_url, video_intro_url, email, phone, website, theme, custom_buttons, social_links')
        .eq('user_id', uid.trim())
        .single();
      profile = data as ProfileRow | null;
      profileError = error;
      if (profileError || !profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const userId = profile.user_id;

    // Fetch user's links (anon needs RLS "public read links" - run migration 005 if needed)
    let links: { id: string; title: string; url: string; type: string; sort_order: number }[] = [];
    const { data: linksData, error: linksError } = await supabase
      .from('links')
      .select('id, title, url, type, sort_order')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });
    if (!linksError && Array.isArray(linksData)) links = linksData;

    // Plan for verified badge (Pro)
    let plan: string = 'free';
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', userId)
      .maybeSingle();
    if (sub?.plan === 'pro') plan = 'pro';

    return NextResponse.json({
      id: profile.id,
      user_id: userId,
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
      plan,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Profile API error: ${message}` },
      { status: 500 }
    );
  }
}
