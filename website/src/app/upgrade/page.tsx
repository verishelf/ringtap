'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState } from 'react';

type Interval = 'month' | 'year';

function UpgradeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const userId = searchParams.get('user_id') ?? '';
  const [status, setStatus] = useState<'idle' | 'redirecting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(
    async (interval: Interval) => {
      const emailToUse = email.trim();
      if (!emailToUse) {
        setError('Add ?email=your@email.com to the URL, or open this page from the RingTap app.');
        setStatus('error');
        return;
      }
      setStatus('redirecting');
      setError(null);
      try {
        const res = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: emailToUse,
            user_id: userId || undefined,
            interval,
          }),
        });
        const data = (await res.json()) as { url?: string; error?: string };
        if (!res.ok) {
          setError(data.error ?? 'Could not start checkout');
          setStatus('error');
          return;
        }
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        setError('No checkout URL returned');
        setStatus('error');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Network error');
        setStatus('error');
      }
    },
    [email, userId]
  );

  if (!email.trim()) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Upgrade to Pro</h1>
          <p className="text-muted-light mb-8">Get the app to upgrade. Pro includes unlimited links, themes, analytics, and video intro.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://apps.apple.com/app/ringtap"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center gap-3 rounded-xl bg-surface-elevated px-6 text-foreground font-medium hover:bg-accent hover:text-background transition-colors border border-border-light"
            >
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Download on the App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=me.ringtap.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-14 items-center gap-3 rounded-xl bg-surface-elevated px-6 text-foreground font-medium hover:bg-accent hover:text-background transition-colors border border-border-light"
            >
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.634z" />
              </svg>
              Get it on Google Play
            </a>
          </div>
          <Link href="/" className="mt-8 inline-block text-accent font-semibold hover:underline">
            Back to RingTap
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'redirecting') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <p className="text-foreground font-semibold">Taking you to secure payment…</p>
          <p className="text-muted-light text-sm mt-2">If nothing happens, go back and choose a plan again.</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <p className="text-destructive font-medium">{error}</p>
          <Link href={`/upgrade?email=${encodeURIComponent(email)}${userId ? `&user_id=${encodeURIComponent(userId)}` : ''}`} className="mt-6 inline-block rounded-xl bg-accent text-background px-6 py-3 font-semibold">
            Try again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-foreground text-center mb-2">Upgrade to Pro</h1>
        <p className="text-muted-light text-center text-sm mb-8">Unlimited links, themes, analytics, video intro. Cancel anytime.</p>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => startCheckout('month')}
            className="w-full rounded-xl border-2 border-border-light bg-surface-elevated hover:border-accent hover:bg-surface-elevated/90 transition-colors px-6 py-4 text-left"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Monthly</span>
              <span className="text-accent font-bold">$9<span className="text-sm font-normal text-muted-light">/month</span></span>
            </div>
            <p className="text-muted-light text-sm mt-1">Billed monthly</p>
          </button>

          <button
            type="button"
            onClick={() => startCheckout('year')}
            className="w-full rounded-xl border-2 border-accent bg-surface-elevated hover:opacity-95 transition-opacity px-6 py-4 text-left relative"
          >
            <span className="absolute top-2 right-2 text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded">Save 8%</span>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-foreground">Yearly</span>
              <span className="text-accent font-bold">$99<span className="text-sm font-normal text-muted-light">/year</span></span>
            </div>
            <p className="text-muted-light text-sm mt-1">$8.25/month, billed once per year</p>
          </button>
        </div>

        <p className="text-muted-light text-xs text-center mt-6">Secure checkout by Stripe. You can cancel or change plan anytime from Settings in the app.</p>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
          <img
            src="/loading.gif"
            alt="Loading"
            className="w-16 h-16"
          />
        </div>
      }
    >
      <UpgradeContent />
    </Suspense>
  );
}
