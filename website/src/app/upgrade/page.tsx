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
          <p className="text-muted-light">Open this page from the RingTap app (Settings → Upgrade) or add your email to the URL.</p>
          <Link href="/" className="mt-6 inline-block text-accent font-semibold hover:underline">
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
          <p className="text-muted-light">Loading…</p>
        </div>
      }
    >
      <UpgradeContent />
    </Suspense>
  );
}
