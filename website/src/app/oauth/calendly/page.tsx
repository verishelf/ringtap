'use client';

import { useSearchParams } from 'next/navigation';

/**
 * Calendly OAuth callback landing page.
 * Edge Function redirects here after token exchange.
 * In-app browser closes when this URL loads (matches openAuthSessionAsync redirectUrl).
 * Do NOT redirect to ringtap:// — that hangs the WebView. The session closes on URL load.
 */
export default function OAuthCalendlyPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');

  return (
    <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-white">
      <p className="text-lg">
        {status === 'success' ? 'Connected! Closing…' : 'Redirecting to RingTap…'}
      </p>
    </div>
  );
}
