import type { Metadata } from "next";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProValueSection } from "@/components/ProValueSection";
import { ArrowRight, Check, Crown } from "lucide-react";
import Link from "next/link";

const SITE_URL = "https://www.ringtap.me";

export const metadata: Metadata = {
  title: "RingTap Pro — Lead capture, analytics, map & CRM",
  description:
    "RingTap Pro: unlimited links, full themes, analytics with lead captures, networking map, video intro, inbound lead forms with webhooks (Zapier/Make), follow-ups & pipeline tags, HubSpot sync. $9/month or $99/year.",
  keywords: [
    "RingTap Pro",
    "digital business card Pro",
    "NFC profile analytics",
    "lead capture digital card",
    "HubSpot contact sync",
    "networking map app",
  ],
  openGraph: {
    title: "RingTap Pro — Beyond a digital business card",
    description:
      "Lead forms, webhooks, analytics, map, follow-ups, and HubSpot — workflow after the tap.",
    url: `${SITE_URL}/pro`,
    type: "website",
  },
  alternates: { canonical: `${SITE_URL}/pro` },
};

export default function ProPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header variant="home" />
      <main className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <p className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-accent/10 px-4 py-1 text-xs font-semibold text-accent mb-4">
              <Crown className="h-3.5 w-3.5" aria-hidden />
              Pro
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Turn every tap into measurable pipeline
            </h1>
            <p className="mt-4 text-lg text-muted-light max-w-2xl mx-auto leading-relaxed">
              Free gets you on the map; Pro gives you the workflow serious networkers need — capture, measure, remember,
              and push contacts where your team already works.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/signup?plan=pro"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-background font-semibold hover:opacity-90 transition-opacity"
              >
                Start with Pro
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/#pricing"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border-light px-6 text-foreground font-semibold hover:border-accent transition-colors"
              >
                Compare pricing
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-light">
              Already in the app? Use{" "}
              <Link href="/upgrade" className="text-accent font-medium hover:underline">
                Stripe checkout on the web
              </Link>{" "}
              with your account email.
            </p>
          </div>

          <ProValueSection variant="full" showTagline />

          <div className="mt-12 rounded-2xl border border-border-light bg-surface p-8">
            <h2 className="text-lg font-bold text-foreground mb-4">Simple pricing</h2>
            <ul className="space-y-3 text-sm text-muted-light mb-6">
              <li className="flex gap-2">
                <Check className="h-5 w-5 shrink-0 text-emerald-500" />
                <span>
                  <strong className="text-foreground">$9/month</strong> or{" "}
                  <strong className="text-foreground">$99/year</strong> (save vs monthly)
                </span>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 shrink-0 text-emerald-500" />
                Cancel anytime — billing via Stripe on web; in-app subscriptions via the App Store where applicable.
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 shrink-0 text-emerald-500" />
                Same profile link: <strong className="text-foreground">ringtap.me/you</strong> — Pro unlocks depth,
                not a different URL.
              </li>
            </ul>
            <Link
              href="/signup?plan=pro"
              className="flex w-full sm:w-auto justify-center items-center gap-2 rounded-xl bg-accent px-6 py-3 text-background font-semibold hover:opacity-90"
            >
              Create account & subscribe
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
