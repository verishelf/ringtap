"use client";

import { Header } from "@/components/Header";
import { TrustBanner } from "@/components/TrustBanner";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Stats = {
  code: string;
  name: string;
  totalReferrals: number;
  proConversions: number;
  totalEarningsCents: number;
  pendingCents: number;
  paidCents: number;
  canRequestPayout: boolean;
  minPayoutCents: number;
  commissionPerProCents: number;
  payouts: { id: string; amount_cents: number; status: string; requested_at: string; paid_at?: string }[];
  recentReferrals: { type: string; amount_cents: number; created_at: string }[];
};

function AffiliateDashboardContent() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code") ?? "";

  const [code, setCode] = useState(codeParam);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [payoutEmail, setPayoutEmail] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const c = code.trim().toUpperCase();
    const e = email.trim().toLowerCase();
    if (!c || !e) {
      setError("Enter your code and email");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/affiliates/stats?code=${encodeURIComponent(c)}&email=${encodeURIComponent(e)}`);
      const data = await res.json();
      if (!res.ok) {
        setStats(null);
        setError(data.error ?? "Could not load stats");
        return;
      }
      setStats(data);
      setPayoutEmail(e);
    } catch {
      setError("Something went wrong");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [code, email]);

  const handleRequestPayout = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stats || !payoutEmail.trim()) return;
    setPayoutLoading(true);
    setPayoutSuccess(null);
    setPayoutError(null);
    try {
      const res = await fetch("/api/affiliates/request-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: stats.code,
          email: payoutEmail.trim().toLowerCase(),
          payout_method: "paypal",
          payout_details: { email: payoutEmail.trim() },
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string; error?: string };
      if (data.ok) {
        setPayoutSuccess(data.message ?? "Payout requested!");
        fetchStats();
      } else {
        setPayoutError(data.error ?? "Could not request payout");
      }
    } catch {
      setPayoutError("Something went wrong");
    } finally {
      setPayoutLoading(false);
    }
  }, [stats, payoutEmail, fetchStats]);

  useEffect(() => {
    if (codeParam) setCode(codeParam);
  }, [codeParam]);

  return (
    <div className="min-h-screen bg-background">
      <Header variant="home" />
      <TrustBanner />

      <main className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/affiliates"
            className="inline-flex items-center gap-2 text-sm text-muted-light hover:text-foreground transition-colors mb-8"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to affiliates
          </Link>

          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            Affiliate Dashboard
          </h1>
          <p className="mt-2 text-muted-light">
            Enter your code and email to view your earnings and request payouts.
          </p>

          {!stats ? (
            <form
              onSubmit={(e) => { e.preventDefault(); fetchStats(); }}
              className="mt-8 space-y-4"
            >
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-foreground mb-2">
                  Your affiliate code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ABC12345"
                  className="w-full rounded-xl border border-border-light bg-surface px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email (must match registration)
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
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-accent px-6 py-3 text-background font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Loading…" : "View dashboard"}
              </button>
            </form>
          ) : (
            <div className="mt-8 space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border border-border-light bg-surface p-4">
                  <p className="text-xs text-muted-light uppercase tracking-wider">Pro conversions</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stats.proConversions}</p>
                </div>
                <div className="rounded-xl border border-border-light bg-surface p-4">
                  <p className="text-xs text-muted-light uppercase tracking-wider">Total earned</p>
                  <p className="text-2xl font-bold text-accent mt-1">${(stats.totalEarningsCents / 100).toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-border-light bg-surface p-4">
                  <p className="text-xs text-muted-light uppercase tracking-wider">Pending</p>
                  <p className="text-2xl font-bold text-foreground mt-1">${(stats.pendingCents / 100).toFixed(2)}</p>
                </div>
                <div className="rounded-xl border border-border-light bg-surface p-4">
                  <p className="text-xs text-muted-light uppercase tracking-wider">Paid out</p>
                  <p className="text-2xl font-bold text-foreground mt-1">${(stats.paidCents / 100).toFixed(2)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border-light bg-surface p-6">
                <h2 className="text-lg font-semibold text-foreground">Commission</h2>
                <p className="mt-2 text-sm text-muted-light">
                  $5 per Pro conversion. Minimum payout: ${(stats.minPayoutCents / 100).toFixed(0)}.
                </p>
                {stats.canRequestPayout ? (
                  <form onSubmit={handleRequestPayout} className="mt-6 space-y-4">
                    <div>
                      <label htmlFor="paypal" className="block text-sm font-medium text-foreground mb-2">
                        PayPal email for payout
                      </label>
                      <input
                        id="paypal"
                        type="email"
                        value={payoutEmail}
                        onChange={(e) => setPayoutEmail(e.target.value)}
                        placeholder="paypal@example.com"
                        required
                        className="w-full rounded-xl border border-border-light bg-surface-elevated px-4 py-3 text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                        disabled={payoutLoading}
                      />
                    </div>
                    {payoutSuccess && <p className="text-sm text-accent">{payoutSuccess}</p>}
                    {payoutError && <p className="text-sm text-destructive">{payoutError}</p>}
                    <button
                      type="submit"
                      disabled={payoutLoading}
                      className="rounded-xl bg-accent px-6 py-3 text-background font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
                    >
                      {payoutLoading ? "Requesting…" : `Request $${(stats.pendingCents / 100).toFixed(2)} payout`}
                    </button>
                  </form>
                ) : (
                  <p className="mt-4 text-sm text-muted-light">
                    You need ${((stats.minPayoutCents - stats.pendingCents) / 100).toFixed(2)} more in pending earnings to request a payout.
                  </p>
                )}
              </div>

              {stats.payouts.length > 0 && (
                <div className="rounded-2xl border border-border-light bg-surface p-6">
                  <h2 className="text-lg font-semibold text-foreground">Payout history</h2>
                  <ul className="mt-4 space-y-3">
                    {stats.payouts.map((p) => (
                      <li key={p.id} className="flex justify-between items-center text-sm">
                        <span className="text-foreground">${(p.amount_cents / 100).toFixed(2)}</span>
                        <span className={`capitalize ${p.status === 'paid' ? 'text-accent' : 'text-muted-light'}`}>
                          {p.status}
                        </span>
                        <span className="text-muted-light">
                          {new Date(p.requested_at).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-2xl border border-border-light bg-surface p-6">
                <h2 className="text-lg font-semibold text-foreground">Recent referrals</h2>
                {stats.recentReferrals.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-light">No referrals yet. Share your link to get started.</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {stats.recentReferrals.map((r, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="text-muted-light">{r.type === "pro" ? "Pro conversion" : "Signup"}</span>
                        <span className="text-accent">+${((r.amount_cents ?? 0) / 100).toFixed(2)}</span>
                        <span className="text-muted-light">{new Date(r.created_at).toLocaleDateString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AffiliateDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AffiliateDashboardContent />
    </Suspense>
  );
}
