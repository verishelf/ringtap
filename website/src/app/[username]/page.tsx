'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.ringtap.me';

const RESERVED = new Set(['activate', 'privacy', 'store', 'profile', 'api']);

type ProfileData = {
  id: string;
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
      const res = await fetch(`${API_BASE}/api/profile?username=${encodeURIComponent(slug)}`);
      if (!res.ok) {
        if (res.status === 404) setError('Profile not found');
        else setError('Failed to load');
        setLoading(false);
        return;
      }
      const json = await res.json();
      setProfile(json);
    } catch {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-4">
        <p className="text-destructive">{error ?? 'Profile not found'}</p>
        <Link href="/" className="text-accent hover:underline">Back to RingTap</Link>
      </div>
    );
  }

  const socialLinks = profile.social_links && typeof profile.social_links === 'object'
    ? Object.entries(profile.social_links).filter(([, v]) => v && String(v).trim())
    : [];
  const links = Array.isArray(profile.links) ? profile.links : [];

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-lg mx-auto">
        <div className="rounded-2xl border border-border-light bg-surface p-6 space-y-6">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-20 h-20 rounded-full object-cover bg-surface-elevated"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-surface-elevated flex items-center justify-center text-2xl text-muted">
                {profile.name?.charAt(0) ?? '?'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground">{profile.name || 'No name'}</h1>
              {profile.title ? <p className="text-muted-light">{profile.title}</p> : null}
              <p className="text-sm text-muted">ringtap.me/{profile.username}</p>
            </div>
          </div>
          {profile.bio ? (
            <p className="text-foreground">{profile.bio}</p>
          ) : null}
          {(profile.email || profile.phone || profile.website) ? (
            <div className="space-y-2 border-t border-border-light pt-4">
              <p className="text-sm font-semibold text-foreground">Contact</p>
              {profile.email ? (
                <a href={`mailto:${profile.email}`} className="block text-accent hover:underline">{profile.email}</a>
              ) : null}
              {profile.phone ? (
                <a href={`tel:${profile.phone}`} className="block text-accent hover:underline">{profile.phone}</a>
              ) : null}
              {profile.website ? (
                <a href={ensureUrl(profile.website)} target="_blank" rel="noopener noreferrer" className="block text-accent hover:underline">{profile.website}</a>
              ) : null}
            </div>
          ) : null}
          {socialLinks.length > 0 ? (
            <div className="border-t border-border-light pt-4">
              <div className="flex flex-wrap gap-2">
                {socialLinks.map(([key, url]) => (
                  <a
                    key={key}
                    href={ensureUrl(url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-surface-elevated px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-background transition-colors"
                  >
                    {key}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
          {links.length > 0 ? (
            <div className="border-t border-border-light pt-4 space-y-2">
              {links.map((link) => (
                <a
                  key={link.id}
                  href={ensureUrl(link.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl bg-accent text-background px-4 py-3 text-center font-semibold hover:opacity-90 transition-opacity"
                >
                  {link.title || link.url}
                </a>
              ))}
            </div>
          ) : null}
        </div>
        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/" className="text-accent hover:underline">RingTap</Link>
        </p>
      </div>
    </div>
  );
}
