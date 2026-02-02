'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.ringtap.me';

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
};

export default function ProfilePage() {
  const params = useParams();
  const uid = typeof params.uid === 'string' ? params.uid : '';
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/profile?uid=${encodeURIComponent(uid)}`);
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
  }, [uid]);

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
              {profile.username ? (
                <p className="text-sm text-muted">ringtap.me/{profile.username}</p>
              ) : null}
            </div>
          </div>
          {profile.bio ? (
            <p className="text-foreground">{profile.bio}</p>
          ) : null}
          {(profile.email || profile.phone || profile.website) ? (
            <div className="space-y-2 border-t border-border-light pt-4">
              {profile.email ? (
                <a href={`mailto:${profile.email}`} className="block text-accent hover:underline">{profile.email}</a>
              ) : null}
              {profile.phone ? (
                <a href={`tel:${profile.phone}`} className="block text-accent hover:underline">{profile.phone}</a>
              ) : null}
              {profile.website ? (
                <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="block text-accent hover:underline">{profile.website}</a>
              ) : null}
            </div>
          ) : null}
          {socialLinks.length > 0 ? (
            <div className="flex flex-wrap gap-2 border-t border-border-light pt-4">
              {socialLinks.map(([key, url]) => (
                <a
                  key={key}
                  href={url.startsWith('http') ? url : `https://${url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-surface-elevated px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-background transition-colors"
                >
                  {key}
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
