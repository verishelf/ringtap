import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import {
  AD_LANDING_PAGES,
  AD_LANDING_SLUGS,
  APP_STORE_BADGE_SRC,
  APP_STORE_URL,
} from "@/data/adLandingPages";
import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://www.ringtap.me";

export const metadata: Metadata = {
  title: "RingTap Landing Pages — Ad & Campaign Destinations",
  description:
    "Choose a RingTap campaign landing page: service professionals, NFC tap-to-share, or free digital business card. Download on the App Store or start free.",
  keywords: ["RingTap landing page", "digital business card campaign", "NFC business card ads"],
  openGraph: {
    title: "RingTap campaign landing pages",
    description: "Dedicated URLs for paid tests and SEO. Each page has unique copy and metadata.",
    url: `${SITE_URL}/landing`,
    type: "website",
    siteName: "RingTap",
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: "RingTap" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "RingTap landing pages",
    description: "Dedicated URLs for ads and organic tests.",
  },
  alternates: { canonical: `${SITE_URL}/landing` },
  robots: { index: true, follow: true },
};

export default function LandingIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header variant="home" />
      <main className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold text-foreground md:text-4xl">Landing pages</h1>
          <p className="mt-4 text-muted-light">
            Use these URLs as destinations for Meta, Google, or creator ads—each has unique SEO metadata and a focused
            pitch.
          </p>
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block transition-opacity hover:opacity-90"
            aria-label="Download RingTap on the App Store"
          >
            <img src={APP_STORE_BADGE_SRC} alt="Download on the App Store" className="mx-auto h-11 w-auto" />
          </a>
        </div>
        <ul className="mx-auto mt-14 max-w-xl space-y-3">
          {AD_LANDING_SLUGS.map((slug) => {
            const cfg = AD_LANDING_PAGES[slug];
            return (
              <li key={slug}>
                <Link
                  href={`/landing/${slug}`}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-border-light bg-surface p-4 hover:border-accent transition-colors"
                >
                  <div className="text-left min-w-0">
                    <p className="font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                      {cfg.h1}
                    </p>
                    <p className="text-xs text-muted-light mt-1 truncate">{`/landing/${slug}`}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-light group-hover:text-accent" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mx-auto mt-10 max-w-md text-center text-sm text-muted">
          <Link href="/" className="text-accent hover:underline">
            ringtap.me
          </Link>
        </p>
      </main>
      <Footer />
    </div>
  );
}
