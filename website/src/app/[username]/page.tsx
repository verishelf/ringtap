'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const RESERVED = new Set(['activate', 'privacy', 'store', 'profile', 'api', 'setup', 'upgrade', 'nfc', 'qr']);

/** Send event to GA4 (matches app analytics: taps, scans, link clicks) */
function sendGA4Event(eventName: string, params?: Record<string, string | number | undefined>) {
  if (typeof window === 'undefined') return;
  const p = { ...params };
  if (window.gtag) {
    window.gtag('event', eventName, p);
  } else if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(['event', eventName, p]);
  }
}

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  threads: 'Threads',
  x: 'X',
  cashapp: 'Cash App',
  venmo: 'Venmo',
  paypal: 'PayPal',
  zelle: 'Zelle',
  other: 'Link',
};

/** Social platform icon components (inline SVG, 24x24) */
function SocialIcon({ platform, className = 'w-6 h-6' }: { platform: string; className?: string }) {
  const c = className;
  switch (platform.toLowerCase()) {
    case 'instagram':
      return (
        <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'threads':
      return (
        <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12.186 24h-.007c-3.381 0-6.354-.923-8.549-2.509C1.406 19.921 0 17.458 0 14.648V9.376c0-2.689 1.395-5.134 3.695-6.648C5.89 1.212 8.863.289 12.244.289h.014c2.746 0 5.35.673 7.591 1.968 2.582 1.506 4.157 3.978 4.157 6.723v5.273c0 2.745-1.575 5.217-4.158 6.723-2.241 1.295-4.845 1.967-7.591 1.967h-.012zM12.212 2.49c-2.944 0-5.53.795-7.441 2.272C2.86 6.24 1.875 8.211 1.875 9.376v5.272c0 1.165.985 3.137 2.896 4.614 1.911 1.477 4.497 2.272 7.441 2.272h.007c2.944 0 5.53-.795 7.442-2.272 1.91-1.477 2.895-3.449 2.895-4.614V9.376c0-1.165-.984-3.136-2.895-4.614C17.742 3.285 15.156 2.49 12.212 2.49zm.028 4.376c1.507 0 2.718 1.24 2.718 2.757v5.754c0 1.518-1.21 2.757-2.718 2.757-1.507 0-2.718-1.24-2.718-2.757V9.623c0-1.518 1.21-2.757 2.718-2.757zm0 1.875c-.472 0-.844.39-.844.882v5.754c0 .492.372.882.844.882.472 0 .844-.39.844-.882V9.623c0-.492-.372-.882-.844-.882z" />
        </svg>
      );
    case 'x':
      return (
        <svg className={c} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'cashapp':
      // Simplified Cash App badge
      return (
        <svg className={c} viewBox="0 0 24 24" aria-hidden>
          <rect x="2" y="2" width="20" height="20" rx="4" fill="white" />
          <path
            d="M12 6.75c-1.933 0-3.5 1.233-3.5 3 0 1.59 1.137 2.437 2.863 2.82l.89.2c.86.192 1.247.47 1.247.98 0 .63-.62 1.1-1.5 1.1-1.028 0-1.797-.43-2.24-1.217a.5.5 0 0 0-.7-.18l-.97.6a.5.5 0 0 0-.17.68C9.55 16.52 10.7 17.25 12 17.25c2.047 0 3.5-1.22 3.5-3.05 0-1.64-1.102-2.46-2.887-2.86l-.83-.19c-.87-.2-1.283-.47-1.283-.98 0-.58.57-1.02 1.5-1.02.86 0 1.52.35 1.96 1.01a.5.5 0 0 0 .71.13l.93-.68a.5.5 0 0 0 .12-.68C15.06 7.36 13.7 6.75 12 6.75Z"
            fill="black"
          />
        </svg>
      );
    case 'venmo':
      // Venmo blue circle with white V, so it stays visible on all backgrounds
      return (
        <svg className={c} viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="#3D95CE" />
          <path
            d="M9 8.5h2.1l1.1 4.2 1.7-4.2H17l-3.1 7H11L9 8.5Z"
            fill="white"
          />
        </svg>
      );
    case 'paypal':
      // Simple rounded P badge
      return (
        <svg className={c} viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="white" />
          <path
            d="M10 7.5h3c1.66 0 2.75 1.02 2.75 2.5 0 1.6-1.2 2.75-2.97 2.75H11.3L11 16.5H9L10 7.5Zm2.7 3.7c.68 0 1.13-.4 1.13-.95 0-.54-.37-.9-.98-.9h-1.1l-.27 1.85h1.22Z"
            fill="currentColor"
          />
        </svg>
      );
    case 'zelle':
      // Simple rounded Z badge
      return (
        <svg className={c} viewBox="0 0 24 24" aria-hidden>
          <circle cx="12" cy="12" r="10" fill="white" />
          <path
            d="M9 8.5h6v1.5l-3.5 4.1H15V16H9v-1.5l3.5-4.1H9V8.5Z"
            fill="currentColor"
          />
        </svg>
      );
    default:
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
  }
}

/** Contact section icons — match app (Ionicons mail-outline, globe-outline, call-outline) */
function ContactIcon({ type, className = 'w-4 h-4 shrink-0 text-muted' }: { type: 'mail' | 'globe' | 'call'; className?: string }) {
  const c = className;
  switch (type) {
    case 'mail':
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <path d="M22 6l-10 7L2 6" />
        </svg>
      );
    case 'globe':
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case 'call':
      return (
        <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
  }
}

const DEEP_LINK_SCHEME = 'ringtap://';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

type ProfileData = {
  id: string;
  user_id?: string;
  username: string;
  name: string;
  title: string;
  bio: string;
  avatar_url: string | null;
  video_intro_url?: string | null;
  background_image_url?: string | null;
  email?: string;
  phone?: string;
  website?: string;
  social_links?: Record<string, string>;
  links?: { id: string; title: string; url: string; type: string }[];
  plan?: string;
  theme?: {
    profileBorderColor?: string;
    accentColor?: string;
    buttonShape?: 'rounded' | 'pill' | 'square';
  };
};

function ensureUrl(url: string): string {
  const u = url.trim();
  if (!u) return '#';
  return /^https?:\/\//i.test(u) ? u : `https://${u}`;
}

/** Button radius class from theme (matches app ProfileTheme.buttonShape) */
function buttonRadiusClass(shape?: 'rounded' | 'pill' | 'square'): string {
  switch (shape) {
    case 'pill': return 'rounded-full';
    case 'square': return 'rounded';
    default: return 'rounded-xl';
  }
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

type AnalyticsRecordType = 'profile_view' | 'nfc_tap' | 'qr_scan';

export default function UsernameProfilePage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const username = typeof params.username === 'string' ? params.username : '';
  const slug = username?.toLowerCase();
  const recordType: AnalyticsRecordType = useMemo(() => {
    if (pathname?.startsWith('/nfc/')) return 'nfc_tap';
    if (pathname?.startsWith('/qr/')) return 'qr_scan';
    return 'profile_view';
  }, [pathname]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [exchangeName, setExchangeName] = useState('');
  const [exchangePhone, setExchangePhone] = useState('');
  const [exchangeEmail, setExchangeEmail] = useState('');
  const [exchangeSubmitting, setExchangeSubmitting] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!slug) {
      setLoading(false);
      return;
    }
    if (RESERVED.has(slug)) {
      setLoading(false);
      router.replace('/');
      return;
    }
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`/api/profile?username=${encodeURIComponent(slug)}`, { signal: controller.signal });
      const text = await res.text();
      clearTimeout(timeoutId);
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
    } catch (e) {
      clearTimeout(timeoutId);
      if ((e as Error)?.name === 'AbortError') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Failed to load. Check your connection or try www.ringtap.me/' + slug);
      }
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

  // Record view for analytics (shows in app Analytics tab) — once per load. Link, NFC, and QR all record here.
  const recordedView = useRef(false);
  useEffect(() => {
    if (!profile?.id || recordedView.current) return;
    recordedView.current = true;
    const payload = { profile_id: profile.id, username: profile.username, type: recordType };
    fetch('/api/analytics/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {});
    sendGA4Event(recordType, {
      profile_username: profile.username,
      profile_id: profile.id,
      source: recordType,
    });
  }, [profile?.id, profile?.username, recordType]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Image
          src={require('../../../../assets/images/loading.gif')}
          alt="Loading profile"
          className="w-16 h-16"
        />
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
  const accentColor = profile.theme?.accentColor;

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6">
      <div className="max-w-lg mx-auto">
        {/* Card — same structure as app ProfileScanPreview */}
        {(() => {
          const proBorderColor = profile.theme?.profileBorderColor ?? '#D4AF37';
          const cardBorderColor = profile.plan === 'pro' ? proBorderColor : undefined;
          const btnClass = buttonRadiusClass(profile.theme?.buttonShape);
          return (
        <div
          className="rounded-2xl border bg-surface overflow-hidden"
          style={cardBorderColor ? { borderColor: cardBorderColor, borderWidth: 2 } : { borderColor: 'var(--border-light)', borderWidth: 1 }}
        >
          {/* Centered header: background behind avatar, name, title, tagline */}
          <div className="relative pt-8 pb-4 px-6 text-center">
            {profile.background_image_url?.trim() ? (
              <>
                <img
                  src={profile.background_image_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-surface/60" aria-hidden />
              </>
            ) : null}
            <div className="relative">
              <div
                className={`mx-auto mb-4 flex items-center justify-center rounded-full bg-surface-elevated ${profile.plan === 'pro' ? 'w-[94px] h-[94px] border-[3px]' : 'w-[88px] h-[88px] border border-border-light'}`}
                style={profile.plan === 'pro' ? { borderColor: proBorderColor } : undefined}
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-[88px] w-[88px] rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-surface-elevated text-3xl text-muted-light">
                    {profile.name?.charAt(0) ?? '?'}
                  </div>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center justify-center gap-2 flex-wrap">
                {profile.name?.trim() || 'No name'}
                {profile.plan === 'pro' ? (
                  <span className="inline-flex shrink-0" title="Verified Pro">
                    <Image
                      src={require('../../../../assets/images/verified.png')}
                      alt="Verified"
                      className="w-5 h-5"
                    />
                  </span>
                ) : null}
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
          </div>

          {profile.video_intro_url?.trim() ? (
            <div className="px-6 pb-4">
              <div className="rounded-xl overflow-hidden bg-black/5 aspect-video max-w-md mx-auto">
                <video
                  src={profile.video_intro_url}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          ) : null}

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
                        onClick={() => sendGA4Event('link_click', { profile_username: profile.username, link_type: 'email', link_url: `mailto:${profile.email}` })}
                        className="flex items-center gap-2 text-muted-light hover:text-accent transition-colors"
                      >
                        <ContactIcon type="mail" />
                        {profile.email}
                      </a>
                    ) : null}
                    {profile.website?.trim() ? (
                      <a
                        href={ensureUrl(profile.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => sendGA4Event('link_click', { profile_username: profile.username, link_type: 'website', link_url: ensureUrl(profile.website!) })}
                        className="flex items-center gap-2 text-muted-light hover:text-accent transition-colors"
                      >
                        <ContactIcon type="globe" />
                        {profile.website}
                      </a>
                    ) : null}
                    {profile.phone?.trim() ? (
                      <a
                        href={`tel:${profile.phone}`}
                        onClick={() => sendGA4Event('link_click', { profile_username: profile.username, link_type: 'phone', link_url: `tel:${profile.phone}` })}
                        className="flex items-center gap-2 text-muted-light hover:text-accent transition-colors"
                      >
                        <ContactIcon type="call" />
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
                      title={SOCIAL_LABELS[key] ?? key}
                      onClick={() => sendGA4Event('link_click', { profile_username: profile.username, link_type: 'social', link_platform: key, link_url: ensureUrl(url) })}
                      className="inline-flex items-center justify-center rounded-xl border border-border-light bg-surface-elevated p-3 text-foreground hover:bg-accent hover:text-background hover:border-accent transition-colors"
                      aria-label={`${SOCIAL_LABELS[key] ?? key}`}
                    >
                      <SocialIcon platform={key} className="w-6 h-6" />
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
                      onClick={() => {
                        if (profile?.id) {
                          fetch('/api/analytics/record', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              profile_id: profile.id,
                              type: 'link_click',
                              link_id: link.id,
                            }),
                          }).catch(() => {});
                        }
                        sendGA4Event('link_click', {
                          profile_username: profile.username,
                          link_type: 'custom',
                          link_id: link.id,
                          link_title: link.title || link.url,
                          link_url: ensureUrl(link.url),
                        });
                      }}
                      className={`${btnClass} bg-accent text-background px-4 py-3.5 text-center font-semibold text-sm hover:opacity-90 transition-opacity block`}
                      style={accentColor ? { backgroundColor: accentColor, color: '#0A0A0B' } : undefined}
                    >
                      {link.title || link.url}
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          )}

          {/* Save contact .vcf + Exchange Contact + Save in App */}
          <div className="border-t border-border-light px-6 py-4 space-y-3">
            <button
              type="button"
              onClick={() => downloadVCard(profile)}
              className={`w-full ${btnClass} bg-accent text-background px-4 py-3.5 text-center font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2`}
              style={accentColor ? { backgroundColor: accentColor, color: '#0A0A0B' } : undefined}
            >
              <span aria-hidden>↓</span>
              Save contact
            </button>
            {userId && (
              <button
                type="button"
                onClick={() => {
                  setExchangeModalOpen(true);
                  setExchangeError(null);
                  setExchangeName('');
                  setExchangePhone('');
                  setExchangeEmail('');
                  const supabase = getSupabase();
                  if (supabase) {
                    supabase.auth.getSession().then(({ data: { session } }) => {
                      setHasSession(!!session);
                    });
                  } else {
                    setHasSession(false);
                  }
                }}
                className={`block w-full ${btnClass} border border-border-light bg-surface-elevated px-4 py-3.5 text-center font-semibold text-sm text-foreground hover:bg-accent hover:text-background hover:border-accent transition-colors`}
              >
                Exchange Contact
              </button>
            )}
            {userId && (
              <a
                href={`${DEEP_LINK_SCHEME}profile/${userId}`}
                className={`block w-full ${btnClass} border border-border-light bg-surface-elevated px-4 py-3.5 text-center font-semibold text-sm text-foreground hover:bg-accent hover:text-background hover:border-accent transition-colors`}
              >
                Save Contact in App
              </a>
            )}
            <p className="text-xs text-muted-light mt-1.5 text-center">
              Downloads a .vcf file to add to your phone contacts
              {userId ? ' · Open in RingTap app to save there' : ''}
            </p>
          </div>

          {exchangeModalOpen && userId && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={() => setExchangeModalOpen(false)}
              role="dialog"
              aria-modal="true"
              aria-labelledby="exchange-modal-title"
            >
              <div
                className="bg-surface rounded-xl p-6 w-full max-w-sm border border-border-light"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 id="exchange-modal-title" className="text-lg font-bold text-foreground mb-1">
                  Exchange Contact
                </h2>
                <p className="text-sm text-muted-light mb-4">
                  Share your info with {profile.name?.trim() || 'this contact'}
                </p>
                {hasSession === false ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-light">
                      Sign in to exchange contacts. Open this profile in the RingTap app to exchange.
                    </p>
                    <a
                      href={`${DEEP_LINK_SCHEME}profile/${userId}`}
                      className={`block w-full ${btnClass} bg-accent text-background px-4 py-3.5 text-center font-semibold text-sm hover:opacity-90`}
                      style={accentColor ? { backgroundColor: accentColor, color: '#0A0A0B' } : undefined}
                    >
                      Open in RingTap App
                    </a>
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const name = exchangeName.trim();
                      if (!name || exchangeSubmitting) return;
                      setExchangeSubmitting(true);
                      setExchangeError(null);
                      const supabase = getSupabase();
                      const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
                      if (!session?.access_token) {
                        setHasSession(false);
                        setExchangeSubmitting(false);
                        return;
                      }
                      try {
                        const res = await fetch('/api/exchange-contact', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${session.access_token}`,
                          },
                          body: JSON.stringify({
                            contact_user_id: userId,
                            name,
                            phone: exchangePhone.trim() || undefined,
                            email: exchangeEmail.trim() || undefined,
                            display_name: profile.name,
                            avatar_url: profile.avatar_url,
                          }),
                        });
                        const data = (await res.json()) as { success?: boolean; error?: string };
                        if (!res.ok) {
                          setExchangeError(data.error ?? 'Failed to exchange');
                          return;
                        }
                        setExchangeModalOpen(false);
                        setExchangeName('');
                        setExchangePhone('');
                        setExchangeEmail('');
                      } catch (err) {
                        setExchangeError(err instanceof Error ? err.message : 'Network error');
                      } finally {
                        setExchangeSubmitting(false);
                      }
                    }}
                    className="space-y-3"
                  >
                    <input
                      type="text"
                      placeholder="Name"
                      value={exchangeName}
                      onChange={(e) => setExchangeName(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-border-light bg-surface-elevated text-foreground text-sm placeholder:text-muted-light"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={exchangePhone}
                      onChange={(e) => setExchangePhone(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-border-light bg-surface-elevated text-foreground text-sm placeholder:text-muted-light"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={exchangeEmail}
                      onChange={(e) => setExchangeEmail(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border border-border-light bg-surface-elevated text-foreground text-sm placeholder:text-muted-light"
                    />
                    {exchangeError && (
                      <p className="text-sm text-destructive">{exchangeError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setExchangeModalOpen(false)}
                        className="flex-1 h-12 rounded-xl border border-border-light text-muted-light font-semibold text-sm hover:bg-surface-elevated"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={exchangeSubmitting || !exchangeName.trim()}
                        className={`flex-1 h-12 rounded-xl bg-accent text-background font-semibold text-sm hover:opacity-90 disabled:opacity-50`}
                        style={accentColor ? { backgroundColor: accentColor, color: '#0A0A0B' } : undefined}
                      >
                        {exchangeSubmitting ? 'Exchanging…' : 'Exchange'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
          );
        })()}

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/" className="text-accent hover:underline" style={accentColor ? { color: accentColor } : undefined}>RingTap</Link>
        </p>
      </div>
    </div>
  );
}
