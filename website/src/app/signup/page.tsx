'use client';

import { Header } from '@/components/Header';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useState } from 'react';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ringtap.me';

function SignupContent() {
  const searchParams = useSearchParams();
  const planParam = (searchParams.get('plan') ?? 'free').toLowerCase();
  const plan = planParam === 'pro' ? 'pro' : 'free';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const handleSignup = useCallback(async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Enter your email');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();

      const redirectTo =
        plan === 'pro'
          ? `${SITE_URL}/auth/callback?plan=pro`
          : `${SITE_URL}/auth/callback`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (signUpError) throw signUpError;

      if (data?.user && !data.user.identities?.length) {
        setError('An account with this email already exists. Try signing in or use a different email.');
        setLoading(false);
        return;
      }

      // If session exists immediately (email confirmation disabled), create profile and redirect
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const profileRes = await fetch('/api/profile/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (profileRes.ok && plan === 'pro') {
          window.location.href = `/upgrade?email=${encodeURIComponent(trimmedEmail)}&user_id=${encodeURIComponent(session.user.id)}`;
          return;
        }
        if (profileRes.ok && plan === 'free') {
          window.location.href = 'ringtap://';
          return;
        }
      }

      setCheckEmail(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }, [email, password, plan]);

  if (checkEmail) {
    return (
      <div className="min-h-screen bg-background">
        <Header variant="home" />
        <main className="pt-24 pb-20 px-6 flex flex-col items-center justify-center min-h-[60vh]">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Check your email</h1>
            <p className="mt-2 text-muted-light">
              We sent a confirmation link to <strong className="text-foreground">{email}</strong>.
              Click the link to activate your account.
            </p>
            <p className="mt-4 text-sm text-muted-light">
              Then open the RingTap app and sign in with your email and password.
            </p>
            <Link href="/" className="mt-8 inline-block text-accent font-semibold hover:underline">
              Back to home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header variant="home" />
      <main className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-light hover:text-foreground transition-colors mb-8"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
          <p className="text-muted-light text-sm mb-8">
            Sign up on the web, then open the RingTap app to complete your profile and start sharing.
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border-light bg-surface-elevated px-4 py-3 text-foreground placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="you@example.com"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-border-light bg-surface-elevated px-4 py-3 text-foreground placeholder:text-muted-light focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                placeholder="At least 6 characters"
                autoComplete="new-password"
                disabled={loading}
                minLength={6}
              />
            </div>

            {plan === 'pro' && (
              <div className="rounded-xl border-2 border-accent bg-accent/5 px-4 py-3 text-sm text-foreground">
                After confirming your email, you&apos;ll go to secure checkout to subscribe to Pro ($9/month or $99/year).
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button
              type="button"
              onClick={handleSignup}
              disabled={loading}
              className="w-full rounded-xl bg-accent py-3 text-background font-semibold hover:bg-accent/90 disabled:opacity-70 transition-opacity"
            >
              {loading ? 'Creating account…' : plan === 'pro' ? 'Create account & go to Pro checkout' : 'Create free account'}
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-muted-light">
            Already have an account?{' '}
            <Link href="/" className="text-accent font-medium hover:underline">
              Download the app and sign in there
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
          <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="mt-6 text-muted-light">Loading…</p>
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
