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
  video_intro_url: string | null;
  background_image_url: string | null;
  email: string;
  phone: string;
  website: string;
  social_links: Record<string, string>;
};

/** If url is a storage path (avatars/... or intros/...), return full public URL; else return as-is. */
function resolveStorageUrl(supabaseUrl: string, url: string | null): string | null {
  if (!url || !url.trim()) return null;
  const u = url.trim();
  if (/^https?:\/\//i.test(u)) return u;
  const base = supabaseUrl.replace(/\/$/, '');
  if (u.startsWith('avatars/') || u.startsWith('intros/') || u.startsWith('backgrounds/')) {
    return `${base}/storage/v1/object/public/profiles/${u}`;
  }
  return u;
}

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
      const pattern = slug.replace(/%/g, '\\%').replace(/_/g, '\\_');
      const { data: row, error: lookupErr } = await supabase
        .from('profiles')
        .select('id, user_id, username, name, title, bio, avatar_url, video_intro_url, background_image_url, email, phone, website, theme, custom_buttons, social_links')
        .ilike('username', pattern)
        .maybeSingle();
      profile = row as ProfileRow | null;
      profileError = lookupErr;
      if (!profile) {
        const errMsg = profileError && typeof (profileError as { message?: string }).message === 'string'
          ? (profileError as { message: string }).message
          : '';
        return NextResponse.json(
          {
            error: `No profile with username "${slug}". ${errMsg ? `(Supabase: ${errMsg}. If this is an RLS error, add policy "Public can read profile by username" ON profiles FOR SELECT USING (true).) ` : ''}In the RingTap app: Profile → Edit → set Username → Save. App and website must use the same Supabase project.`,
          },
          { status: 404 }
        );
      }
    } else if (uid?.trim()) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, name, title, bio, avatar_url, video_intro_url, background_image_url, email, phone, website, theme, custom_buttons, social_links')
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

    const avatarUrl = resolveStorageUrl(supabaseUrl, profile.avatar_url);
    const videoIntroUrl = resolveStorageUrl(supabaseUrl, profile.video_intro_url ?? null);
    const backgroundImageUrl = resolveStorageUrl(supabaseUrl, (profile as { background_image_url?: string | null }).background_image_url ?? null);

    const theme = (profile as { theme?: { profileBorderColor?: string; accentColor?: string; buttonShape?: string; calendlyUrl?: string } }).theme ?? {};
    return NextResponse.json({
      id: profile.id,
      user_id: userId,
      username: profile.username,
      name: profile.name,
      title: profile.title,
      bio: profile.bio,
      avatar_url: avatarUrl ?? profile.avatar_url,
      video_intro_url: videoIntroUrl ?? profile.video_intro_url ?? null,
      background_image_url: backgroundImageUrl ?? (profile as { background_image_url?: string | null }).background_image_url ?? null,
      email: profile.email,
      phone: profile.phone,
      website: profile.website,
      social_links: profile.social_links ?? {},
      links,
      plan,
      theme,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Profile API error: ${message}` },
      { status: 500 }
    );
  }
}
