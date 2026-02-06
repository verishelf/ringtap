'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';


export default function UpgradePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const userId = searchParams.get('user_id') ?? '';
  const [status, setStatus] = useState<'idle' | 'redirecting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async () => {
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
        body: JSON.stringify({ email: emailToUse, user_id: userId || undefined }),
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
  }, [email, userId]);

  useEffect(() => {
    if (status !== 'idle' || !email.trim()) return;
    startCheckout();
  }, [email, status, startCheckout]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {status === 'redirecting' && (
          <>
            <p className="text-foreground font-semibold">Taking you to secure payment…</p>
            <p className="text-muted-light text-sm mt-2">If nothing happens, use the button below.</p>
            <button
              type="button"
              onClick={startCheckout}
              className="mt-6 rounded-xl bg-accent text-background px-6 py-3 font-semibold"
            >
              Continue to payment
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-destructive font-medium">{error}</p>
            <button
              type="button"
              onClick={() => { setStatus('idle'); setError(null); startCheckout(); }}
              className="mt-6 rounded-xl bg-accent text-background px-6 py-3 font-semibold"
            >
              Try again
            </button>
          </>
        )}
        {status === 'idle' && !email.trim() && (
          <>
            <p className="text-muted-light">Open this page from the RingTap app (Settings → Upgrade) or add your email to the URL.</p>
            <Link href="/" className="mt-6 inline-block text-accent font-semibold hover:underline">Back to RingTap</Link>
          </>
        )}
      </div>
    </div>
  );
}
