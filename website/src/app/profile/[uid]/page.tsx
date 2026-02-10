\"use client\";

import Link from \"next/link\";
import { useParams } from \"next/navigation\";
import { useCallback, useEffect, useState } from \"react\";

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || \"https://www.ringtap.me\";

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

const SOCIAL_LABELS: Record<string, string> = {
  instagram: \"Instagram\",
  tiktok: \"TikTok\",
  facebook: \"Facebook\",
  linkedin: \"LinkedIn\",
  youtube: \"YouTube\",
  threads: \"Threads\",
  x: \"X\",
  cashapp: \"Cash App\",
  venmo: \"Venmo\",
  paypal: \"PayPal\",
  zelle: \"Zelle\",
  other: \"Link\",
};

/** Social / payment platform icon components (inline SVG, 20x20) */
function SocialIcon({ platform, className = \"w-5 h-5\" }: { platform: string; className?: string }) {
  const c = className;
  switch (platform.toLowerCase()) {
    case \"instagram\":
      return (
        <svg className={c} viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden>
          <path d=\"M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z\" />
        </svg>
      );
    case \"tiktok\":
      return (
        <svg className={c} viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden>
          <path d=\"M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z\" />
        </svg>
      );
    case \"facebook\":
      return (
        <svg className={c} viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden>
          <path d=\"M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z\" />
        </svg>
      );
    case \"linkedin\":
      return (
        <svg className={c} viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden>
          <path d=\"M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z\" />
        </svg>
      );
    case \"youtube\":
      return (
        <svg className={c} viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden>
          <path d=\"M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z\" />
        </svg>
      );
    case \"threads\":
      return (
        <svg className={c} viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden>
          <path d=\"M12.186 24h-.007c-3.381 0-6.354-.923-8.549-2.509C1.406 19.921 0 17.458 0 14.648V9.376c0-2.689 1.395-5.134 3.695-6.648C5.89 1.212 8.863.289 12.244.289h.014c2.746 0 5.35.673 7.591 1.968 2.582 1.506 4.157 3.978 4.157 6.723v5.273c0 2.745-1.575 5.217-4.158 6.723-2.241 1.295-4.845 1.967-7.591 1.967h-.012zM12.212 2.49c-2.944 0-5.53.795-7.441 2.272C2.86 6.24 1.875 8.211 1.875 9.376v5.272c0 1.165.985 3.137 2.896 4.614 1.911 1.477 4.497 2.272 7.441 2.272h.007c2.944 0 5.53-.795 7.442-2.272 1.91-1.477 2.895-3.449 2.895-4.614V9.376c0-1.165-.984-3.136-2.895-4.614C17.742 3.285 15.156 2.49 12.212 2.49zm.028 4.376c1.507 0 2.718 1.24 2.718 2.757v5.754c0 1.518-1.21 2.757-2.718 2.757-1.507 0-2.718-1.24-2.718-2.757V9.623c0-1.518 1.21-2.757 2.718-2.757zm0 1.875c-.472 0-.844.39-.844.882v5.754c0 .492.372.882.844.882.472 0 .844-.39.844-.882V9.623c0-.492-.372-.882-.844-.882z\" />
        </svg>
      );
    case \"x\":
      return (
        <svg className={c} viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden>
          <path d=\"M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z\" />
        </svg>
      );
    case \"cashapp\":
      // Match app CashAppIcon look (white badge with black S)
      return (
        <svg className={c} viewBox=\"0 0 34 24\" aria-hidden>
          <rect x=\"0\" y=\"0\" width=\"34\" height=\"24\" rx=\"4\" fill=\"#FFFFFF\" />
          <path
            d=\"M17.8071 10.5742C20.3356 11.1161 21.4915 12.1636 21.4915 13.9336C21.4915 16.1525 19.6847 17.7904 16.8642 17.9637L16.589 19.2762C16.5621 19.4045 16.4489 19.4964 16.3179 19.4964H14.1479C13.9691 19.4964 13.8371 19.3294 13.8784 19.1554L14.2267 17.6877C12.8286 17.2899 11.7036 16.5161 11.0477 15.5609C10.9652 15.4407 10.9926 15.2764 11.1077 15.1868L12.6244 14.0072C12.7494 13.91 12.9286 13.9385 13.021 14.0671C13.8246 15.1856 15.0575 15.8481 16.5428 15.8481C17.8793 15.8481 18.8907 15.1979 18.8907 14.2587C18.8907 13.5362 18.385 13.2111 16.6873 12.8499C13.7614 12.2358 12.6055 11.1522 12.6055 9.38219C12.6055 7.32855 14.3314 5.77721 16.9349 5.57572L17.2191 4.22015C17.246 4.09187 17.3591 4 17.4902 4H19.631C19.8076 4 19.9391 4.16305 19.9017 4.33565L19.5726 5.85451C20.6929 6.19935 21.6051 6.81594 22.1729 7.5768C22.2609 7.69474 22.2383 7.86174 22.1245 7.95505L20.7408 9.08972C20.6205 9.18832 20.445 9.16679 20.3472 9.04587C19.6439 8.17604 18.5368 7.68446 17.3375 7.68446C16.001 7.68446 15.1702 8.26241 15.1702 9.09322C15.1702 9.77954 15.8204 10.1408 17.8071 10.5742Z\"
            fill=\"#000000\"
          />
        </svg>
      );
    case \"venmo\":
      // Venmo blue circle with white V, so it stays visible on all backgrounds
      return (
        <svg className={c} viewBox=\"0 0 24 24\" aria-hidden>
          <circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"#3D95CE\" />
          <path
            d=\"M9 8.5h2.1l1.1 4.2 1.7-4.2H17l-3.1 7H11L9 8.5Z\"
            fill=\"white\"
          />
        </svg>
      );
    case \"paypal\":
      // Rounded P badge
      return (
        <svg className={c} viewBox=\"0 0 24 24\" aria-hidden>
          <circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"white\" />
          <path
            d=\"M10 7.5h3c1.66 0 2.75 1.02 2.75 2.5 0 1.6-1.2 2.75-2.97 2.75H11.3L11 16.5H9L10 7.5Zm2.7 3.7c.68 0 1.13-.4 1.13-.95 0-.54-.37-.9-.98-.9h-1.1l-.27 1.85h1.22Z\"
            fill=\"currentColor\"
          />
        </svg>
      );
    case \"zelle\":
      // Rounded Z badge
      return (
        <svg className={c} viewBox=\"0 0 24 24\" aria-hidden>
          <circle cx=\"12\" cy=\"12\" r=\"10\" fill=\"white\" />
          <path
            d=\"M9 8.5h6v1.5l-3.5 4.1H15V16H9v-1.5l3.5-4.1H9V8.5Z\"
            fill=\"currentColor\"
          />
        </svg>
      );
    default:
      return (
        <svg
          className={c}
          viewBox=\"0 0 24 24\"
          fill=\"none\"
          stroke=\"currentColor\"
          strokeWidth=\"2\"
          strokeLinecap=\"round\"
          strokeLinejoin=\"round\"
          aria-hidden
        >
          <path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\" />
          <path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\" />
        </svg>
      );
  }
}

export default function ProfilePage() {
  const params = useParams();
  const uid = typeof params.uid === \"string\" ? params.uid : \"\";
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
        if (res.status === 404) setError(\"Profile not found\");
        else setError(\"Failed to load\");
        setLoading(false);
        return;
      }
      const json = await res.json();
      setProfile(json);
    } catch {
      setError(\"Failed to load\");
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) {
    return (
      <div className=\"min-h-screen bg-background flex items-center justify-center px-6\">
        <img
          src=\"/loading.gif\"
          alt=\"Loading profile\"
          className=\"w-16 h-16\"
        />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className=\"min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-4\">
        <p className=\"text-destructive\">{error ?? \"Profile not found\"}</p>
        <Link href=\"/\" className=\"text-accent hover:underline\">Back to RingTap</Link>
      </div>
    );
  }

  const socialLinks = profile.social_links && typeof profile.social_links === \"object\"
    ? Object.entries(profile.social_links).filter(([, v]) => v && String(v).trim())
    : [];

  return (
    <div className=\"min-h-screen bg-background py-12 px-6\">
      <div className=\"max-w-lg mx-auto\">
        <div className=\"rounded-2xl border border-border-light bg-surface p-6 space-y-6\">
          <div className=\"flex items-center gap-4\">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=\"\"
                className=\"w-20 h-20 rounded-full object-cover bg-surface-elevated\"
              />
            ) : (
              <div className=\"w-20 h-20 rounded-full bg-surface-elevated flex items-center justify-center text-2xl text-muted\">
                {profile.name?.charAt(0) ?? \"?\"}
              </div>
            )}
            <div>
              <h1 className=\"text-xl font-bold text-foreground\">{profile.name || \"No name\"}</h1>
              {profile.title ? <p className=\"text-muted-light\">{profile.title}</p> : null}
              {profile.username ? (
                <p className=\"text-sm text-muted\">ringtap.me/{profile.username}</p>
              ) : null}
            </div>
          </div>
          {profile.bio ? (
            <p className=\"text-foreground\">{profile.bio}</p>
          ) : null}
          {(profile.email || profile.phone || profile.website) ? (
            <div className=\"space-y-2 border-t border-border-light pt-4\">
              {profile.email ? (
                <a href={`mailto:${profile.email}`} className=\"block text-accent hover:underline\">{profile.email}</a>
              ) : null}
              {profile.phone ? (
                <a href={`tel:${profile.phone}`} className=\"block text-accent hover:underline\">{profile.phone}</a>
              ) : null}
              {profile.website ? (
                <a href={profile.website.startsWith(\"http\") ? profile.website : `https://${profile.website}`} target=\"_blank\" rel=\"noopener noreferrer\" className=\"block text-accent hover:underline\">{profile.website}</a>
              ) : null}
            </div>
          ) : null}
          {socialLinks.length > 0 ? (
            <div className=\"flex flex-wrap gap-2 border-t border-border-light pt-4\">
              {socialLinks.map(([key, url]) => {
                const label = SOCIAL_LABELS[key] ?? key;
                const href = url.startsWith(\"http\") ? url : `https://${url}`;
                return (
                  <a
                    key={key}
                    href={href}
                    target=\"_blank\"
                    rel=\"noopener noreferrer\"
                    className=\"inline-flex items-center gap-2 rounded-lg bg-surface-elevated px-3 py-2 text-sm text-foreground hover:bg-accent hover:text-background transition-colors\"
                  >
                    <SocialIcon platform={key} />
                    <span>{label}</span>
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>
        <p className=\"mt-8 text-center text-sm text-muted\">
          <Link href=\"/\" className=\"text-accent hover:underline\">RingTap</Link>
        </p>
      </div>
    </div>
  );
}

