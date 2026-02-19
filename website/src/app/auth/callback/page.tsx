'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

const DEEP_LINK = 'ringtap://';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') === 'pro' ? 'pro' : 'free';

  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  const init = useCallback(async () => {
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();

      // Let Supabase process hash params (access_token, refresh_token)
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Could not sign you in. The link may have expired. Try signing up again.');
        setStatus('error');
        return;
      }

      // Ensure profile exists (creates with default username if new)
      const res = await fetch('/api/profile/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? 'Failed to set up profile');
        setStatus('error');
        return;
      }

      setStatus('ready');

      if (plan === 'pro') {
        // Redirect to upgrade/checkout
        window.location.href = `/upgrade?email=${encodeURIComponent(session.user.email ?? '')}&user_id=${encodeURIComponent(session.user.id)}`;
        return;
      }

      // Free: redirect to app after a short delay so user sees the success message
      setTimeout(() => {
        window.location.href = DEEP_LINK;
      }, 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setStatus('error');
    }
  }, [plan]);

  useEffect(() => {
    init();
  }, [init]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="mt-6 text-muted-light">Setting up your account…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-destructive font-medium">{error}</p>
          <Link href="/signup" className="mt-6 inline-block text-accent font-semibold hover:underline">
            Try again
          </Link>
        </div>
      </div>
    );
  }

  // ready - free plan: show success before redirecting to app
  if (plan === 'pro') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <p className="text-muted-light">Taking you to checkout…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center mb-6">
          <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground">Account created!</h1>
        <p className="mt-2 text-muted-light">
          Opening the RingTap app…
        </p>
        <a
          href={DEEP_LINK}
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-background font-semibold hover:opacity-90 transition-opacity"
        >
          Open RingTap app
        </a>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
          <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="mt-6 text-muted-light">Loading…</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
