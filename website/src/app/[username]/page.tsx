'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const RESERVED = new Set(['activate', 'privacy', 'store', 'profile', 'api', 'setup']);

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  threads: 'Threads',
  x: 'X',
  other: 'Link',
};

const DEEP_LINK_SCHEME = 'ringtap://';

type ProfileData = {
  id: string;
  user_id?: string;
  username: string;
  name: string;
  title: string;
  bio: string;
  avatar_url: string | null;
  email?: string;
  phone?: string;
  website?: string;
  social_links?: Record<string, string>;
  links?: { id: string; title: string; url: string; type: string }[];
};

function ensureUrl(url: string): string {
  const u = url.trim();
  if (!u) return '#';
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

/** Build a vCard 3.0 string for Save contact (.vcf) */
function buildVCard(profile: ProfileData, baseUrl: string): string {
  const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '');
  const lines: string[] = ['BEGIN:VCARD', 'VERSION:3.0'];
  const fn = profile.name?.trim() || 'Unknown';
  lines.push('FN:' + escape(fn));
  const parts = fn.split(/\s+/);
  const family = parts.length > 1 ? parts.pop()! : '';
  const given = parts.join(' ') || '';
  lines.push('N:' + escape(family) + ';' + escape(given) + ';;;');
  if (profile.title?.trim()) lines.push('TITLE:' + escape(profile.title.trim()));
  if (profile.email?.trim()) lines.push('EMAIL:' + escape(profile.email.trim()));
  if (profile.phone?.trim()) lines.push('TEL:' + escape(profile.phone.trim()));
  if (profile.website?.trim()) lines.push('URL:' + escape(ensureUrl(profile.website)));
  const profileUrl = `${baseUrl}/${profile.username}`;
  lines.push('URL:' + escape(profileUrl));
  if (profile.bio?.trim()) lines.push('NOTE:' + escape(profile.bio.trim()));
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

function downloadVCard(profile: ProfileData): void {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ringtap.me';
  const vcf = buildVCard(profile, baseUrl);
  const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${profile.username || 'contact'}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function UsernameProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = typeof params.username === 'string' ? params.username : '';
  const slug = username?.toLowerCase();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }
    if (RESERVED.has(slug)) {
      router.replace('/');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/profile?username=${encodeURIComponent(slug)}`);
      const text = await res.text();
      if (!res.ok) {
        let msg = 'Failed to load';
        if (res.status === 404) msg = 'Profile not found';
        else {
          try {
            const body = JSON.parse(text);
            if (body?.error && typeof body.error === 'string') msg = body.error;
          } catch {
            if (res.status >= 500) msg = 'Server error. Try again in a moment.';
          }
        }
        setError(msg);
        setLoading(false);
        return;
      }
      const json = JSON.parse(text);
      setProfile(json);
    } catch {
      setError('Failed to load. Check your connection or try www.ringtap.me/' + slug);
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  // If opened inside RingTap app (WebView), redirect to app with user's UUID
  const userId = profile?.user_id;
  const isInApp = typeof window !== 'undefined' && (
    /RingTap|Expo/i.test(navigator.userAgent) ||
    (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('inapp') === '1')
  );
  useEffect(() => {
    if (!userId || !profile || !isInApp) return;
    const deepLink = `${DEEP_LINK_SCHEME}profile/${userId}`;
    window.location.replace(deepLink);
  }, [userId, profile, isInApp]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <p className="text-muted-light">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-4 max-w-md">
        <p className="text-destructive text-center text-sm">{error ?? 'Profile not found'}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => fetchProfile()}
            className="rounded-xl bg-accent px-5 py-2.5 text-background font-semibold hover:opacity-90"
          >
            Retry
          </button>
          <Link href="/" className="text-accent hover:underline py-2.5">Back to RingTap</Link>
        </div>
      </div>
    );
  }

  const socialLinks = profile.social_links && typeof profile.social_links === 'object'
    ? Object.entries(profile.social_links).filter(([, v]) => v && String(v).trim())
    : [];
  const links = Array.isArray(profile.links) ? profile.links : [];
  const hasContact = !!(profile.email?.trim() || profile.phone?.trim() || profile.website?.trim());

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6">
      <div className="max-w-lg mx-auto">
        {/* Card — same structure as app ProfileScanPreview */}
        <div className="rounded-2xl border border-border-light bg-surface overflow-hidden">
          {/* Centered header: avatar, name, title, tagline */}
          <div className="pt-8 pb-4 px-6 text-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="mx-auto rounded-full object-cover bg-surface-elevated border border-border-light mb-4 w-[88px] h-[88px]"
              />
            ) : (
              <div className="w-[88px] h-[88px] mx-auto rounded-full bg-surface-elevated border border-border-light flex items-center justify-center text-3xl text-muted-light mb-4">
                {profile.name?.charAt(0) ?? '?'}
              </div>
            )}
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {profile.name?.trim() || 'No name'}
            </h1>
            {profile.title?.trim() ? (
              <p className="text-muted-light mt-1">{profile.title}</p>
            ) : null}
            {profile.bio?.trim() ? (
              <p className="text-muted-light text-sm mt-2 max-w-md mx-auto line-clamp-2">
                {profile.bio}
              </p>
            ) : null}
            <p className="text-muted text-xs mt-2">ringtap.me/{profile.username}</p>
          </div>

          {(profile.bio?.trim() || hasContact || socialLinks.length > 0 || links.length > 0) && (
            <div className="border-t border-border-light px-6 py-4 space-y-4">
              {profile.bio?.trim() ? (
                <>
                  <h2 className="text-foreground font-bold text-base">About Me</h2>
                  <p className="text-muted-light text-sm leading-relaxed">{profile.bio}</p>
                  <div className="border-t border-border-light my-3" />
                </>
              ) : null}

              {hasContact ? (
                <>
                  <h2 className="text-foreground font-bold text-base">Contact</h2>
                  <div className="space-y-2 text-sm">
                    {profile.email?.trim() ? (
                      <a
                        href={`mailto:${profile.email}`}
                        className="flex items-center gap-2 text-muted-light hover:text-accent transition-colors"
                      >
                        <span className="text-muted" aria-hidden>✉</span>
                        {profile.email}
                      </a>
                    ) : null}
                    {profile.website?.trim() ? (
                      <a
                        href={ensureUrl(profile.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-muted-light hover:text-accent transition-colors"
                      >
                        <span className="text-muted" aria-hidden>◇</span>
                        {profile.website}
                      </a>
                    ) : null}
                    {profile.phone?.trim() ? (
                      <a
                        href={`tel:${profile.phone}`}
                        className="flex items-center gap-2 text-muted-light hover:text-accent transition-colors"
                      >
                        <span className="text-muted" aria-hidden>☎</span>
                        {profile.phone}
                      </a>
                    ) : null}
                  </div>
                  {(socialLinks.length > 0 || links.length > 0) && (
                    <div className="border-t border-border-light pt-3" />
                  )}
                </>
              ) : null}

              {socialLinks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {socialLinks.map(([key, url]) => (
                    <a
                      key={key}
                      href={ensureUrl(url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-border-light bg-surface-elevated px-4 py-2.5 text-sm font-medium text-foreground hover:bg-accent hover:text-background hover:border-accent transition-colors"
                    >
                      {SOCIAL_LABELS[key] ?? key}
                    </a>
                  ))}
                </div>
              ) : null}

              {links.length > 0 ? (
                <div className="space-y-2">
                  {links.map((link) => (
                    <a
                      key={link.id}
                      href={ensureUrl(link.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl bg-accent text-background px-4 py-3.5 text-center font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      {link.title || link.url}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Save contact .vcf + Save in App — always shown */}
          <div className="border-t border-border-light px-6 py-4 space-y-3">
            <button
              type="button"
              onClick={() => downloadVCard(profile)}
              className="w-full rounded-xl bg-accent text-background px-4 py-3.5 text-center font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <span aria-hidden>↓</span>
              Save contact
            </button>
            {userId && (
              <a
                href={`${DEEP_LINK_SCHEME}profile/${userId}`}
                className="block w-full rounded-xl border border-border-light bg-surface-elevated px-4 py-3.5 text-center font-semibold text-sm text-foreground hover:bg-accent hover:text-background hover:border-accent transition-colors"
              >
                Save Contact in App
              </a>
            )}
            <p className="text-xs text-muted-light mt-1.5 text-center">
              Downloads a .vcf file to add to your phone contacts
              {userId ? ' · Open in RingTap app to save there' : ''}
            </p>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/" className="text-accent hover:underline">RingTap</Link>
        </p>
      </div>
    </div>
  );
}
