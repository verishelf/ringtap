"use client";

import { Header } from "@/components/Header";
import { TrustBanner } from "@/components/TrustBanner";
import Link from "next/link";
import { useCallback, useState } from "react";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.ringtap.me";

export default function AffiliatesPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string; link: string } | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      if (!trimmedName || !trimmedEmail) {
        setError("Name and email are required.");
        return;
      }
      setLoading(true);
      setError(null);
      setResult(null);
      try {
        const res = await fetch("/api/affiliates/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: trimmedName, email: trimmedEmail }),
        });
        let data: { code?: string; error?: string };
        try {
          data = (await res.json()) as { code?: string; error?: string };
        } catch {
          setError(res.ok ? "Invalid response from server." : `Request failed (${res.status}). Check that the affiliates table exists—run migrations 007 and 008 in Supabase.`);
          return;
        }
        if (!res.ok) {
          setError(data.error ?? "Could not register. Try again.");
          return;
        }
        if (data.code) {
          const link = `${SITE_URL}?ref=${data.code}`;
          setResult({ code: data.code, link });
        } else {
          setError("No referral code returned. Try again.");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        setError(
          msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network")
            ? "Could not reach server. Check your connection."
            : "Something went wrong. If this persists, ensure Supabase migrations 007 and 008 are run."
        );
      } finally {
        setLoading(false);
      }
    },
    [name, email]
  );

  const copyLink = useCallback(() => {
    if (!result) return;
    navigator.clipboard.writeText(result.link);
    // Could add a toast - for now just copy
  }, [result]);

  return (
    <div className="min-h-screen bg-background">
      <Header variant="home" />
      <TrustBanner />

      <main className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-light hover:text-foreground transition-colors mb-8"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>

          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            RingTap Affiliate Program
          </h1>
          <p className="mt-4 text-muted-light leading-relaxed">
            Share RingTap with your audience and earn when they sign up or upgrade to Pro. Get your unique referral link below.
          </p>

          {!result ? (
            <form onSubmit={handleSubmit} className="mt-10 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Your name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-xl border border-border-light bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border-light bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  disabled={loading}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-accent px-6 py-3 text-background font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Creating…" : "Get my referral link"}
              </button>
            </form>
          ) : (
            <div className="mt-10 rounded-2xl border border-border-light bg-surface p-6">
              <h2 className="text-lg font-semibold text-foreground">Your referral link</h2>
              <p className="mt-2 text-sm text-muted-light">
                Share this link. When someone signs up or upgrades to Pro using it, we&apos;ll track the referral.
              </p>
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={result.link}
                  className="flex-1 rounded-lg border border-border-light bg-surface-elevated px-3 py-2 text-sm text-foreground"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-background hover:bg-accent/90 transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="mt-4 text-xs text-muted">
                Your code: <code className="rounded bg-surface-elevated px-1.5 py-0.5">{result.code}</code>
              </p>
              <div className="mt-6 flex gap-4">
                <Link
                  href={`/affiliates/dashboard?code=${encodeURIComponent(result.code)}`}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  View dashboard & earnings
                </Link>
                <Link
                  href="/"
                  className="text-sm font-medium text-muted-light hover:text-foreground transition-colors"
                >
                  Back to home
                </Link>
              </div>
            </div>
          )}

          <div className="mt-16 rounded-2xl border border-border-light bg-surface p-6">
            <h2 className="text-lg font-semibold text-foreground">How it works</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted-light">
              <li className="flex gap-3">
                <span className="text-accent font-medium">1.</span>
                Get your unique link (e.g. ringtap.me?ref=YOURCODE)
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-medium">2.</span>
                Share it on your blog, social, or with your network
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-medium">3.</span>
                Earn $5 for each Pro conversion—when someone upgrades via your link
              </li>
              <li className="flex gap-3">
                <span className="text-accent font-medium">4.</span>
                Request payouts when you reach $25. Paid via PayPal within 5–7 business days.
              </li>
            </ul>
            <Link
              href="/affiliates/dashboard"
              className="mt-6 inline-block text-sm font-medium text-accent hover:underline"
            >
              View your dashboard →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
