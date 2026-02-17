'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Calendly OAuth callback landing page.
 * Edge Function redirects here after token exchange.
 * In-app browser closes when this URL loads (matches openAuthSessionAsync redirectUrl).
 * Also redirects to ringtap:// for deep link handling.
 */
export default function OAuthCalendlyPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const error = searchParams.get('error');

  useEffect(() => {
    const scheme = 'ringtap://oauth/';
    const target = status === 'success' ? `${scheme}success` : `${scheme}error${error ? `?error=${encodeURIComponent(error)}` : ''}`;
    window.location.href = target;
  }, [status, error]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-white">
      <p className="text-lg">Redirecting to RingTap…</p>
    </div>
  );
}
