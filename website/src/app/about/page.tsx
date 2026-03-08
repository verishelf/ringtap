import { Header } from "@/components/Header";
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://www.ringtap.me";

export const metadata: Metadata = {
  title: "About RingTap — Digital Business Card App | NFC & QR Contact Sharing",
  description:
    "Learn about RingTap, the digital business card app that lets you share your profile instantly with NFC rings, QR codes, or your personal link. Free to start. No app needed for recipients. ringtap.me/you.",
  keywords: [
    "about RingTap",
    "digital business card app",
    "NFC business card",
    "NFC ring",
    "QR code business card",
    "contact sharing app",
    "ringtap.me",
    "digital profile",
  ],
  openGraph: {
    title: "About RingTap — Digital Business Card. One Tap to Share.",
    description: "RingTap is your digital business card. Share your profile with NFC, QR, or link. Free to start. Learn about our mission.",
    url: `${SITE_URL}/about`,
    type: "website",
    siteName: "RingTap",
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: "RingTap - Digital business card" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About RingTap — Digital Business Card. One Tap.",
    description: "Share your profile with NFC, QR, or link. Free to start.",
  },
  alternates: { canonical: `${SITE_URL}/about` },
  robots: { index: true, follow: true },
  category: "technology",
};

const aboutPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About RingTap — Digital Business Card App",
  description: "RingTap is a digital business card app. Share your profile instantly with NFC rings, QR codes, or your personal link. Free to start. No app needed for recipients.",
  url: `${SITE_URL}/about`,
  mainEntity: {
    "@type": "Organization",
    name: "RingTap",
    url: SITE_URL,
    logo: `${SITE_URL}/og.png`,
    description: "Digital business card app. Share your profile with NFC, QR, or link. Free to start.",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "About", item: `${SITE_URL}/about` },
  ],
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header variant="home" />

      <main className="pt-24 pb-20 px-6" role="main">
        <div className="mx-auto max-w-3xl">
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
            About RingTap
          </h1>
          <p className="mt-2 text-muted-light">
            Your digital business card. One tap to share.
          </p>

          <article className="mt-12 space-y-10 text-foreground">
            <section aria-labelledby="what-we-do">
              <h2 id="what-we-do" className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                What we do
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                RingTap is a digital business card app that lets you share your profile instantly—with an NFC ring or card, a QR code, or your personal link (ringtap.me/you). No typing, no paper, no lost cards. People who tap or scan see your name, photo, links, and contact info in their browser. No app required for them.
              </p>
            </section>

            <section aria-labelledby="how-it-works">
              <h2 id="how-it-works" className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                How it works
              </h2>
              <ul className="mt-4 space-y-3 text-muted-light leading-relaxed">
                <li className="flex gap-3">
                  <span className="text-accent font-medium shrink-0">NFC</span>
                  <span>Write your profile URL to an NFC ring or card. Tap it to the back of your phone to share—or have others tap it to open your profile.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent font-medium shrink-0">QR</span>
                  <span>Generate a QR code in the app. Others scan it to open your profile. Works with any QR scanner.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent font-medium shrink-0">Link</span>
                  <span>Your profile lives at ringtap.me/yourusername. Share it by text, email, or add it to your email signature.</span>
                </li>
              </ul>
            </section>

            <section aria-labelledby="our-mission">
              <h2 id="our-mission" className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                Our mission
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                We built RingTap to make networking simpler. Business cards get lost. QR codes are clunky. We wanted one tap—or one link—to share everything. Free to start, with Pro features for unlimited links, custom themes, analytics, and more.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                Legal & attributions
              </h2>
              <div className="mt-4 space-y-4 text-muted-light leading-relaxed">
                <p>
                  <Link href="/terms" className="text-accent hover:underline">
                    Terms of Use
                  </Link>
                  {" · "}
                  <Link href="/privacy" className="text-accent hover:underline">
                    Privacy Policy
                  </Link>
                </p>
                <p>
                  Verified icons created by{" "}
                  <a
                    href="https://www.flaticon.com/free-icons/verified"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    QudaDesign - Flaticon
                  </a>
                  .
                </p>
              </div>
            </section>

            <div className="pt-6">
              <Link
                href="/#download"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-background font-semibold hover:opacity-90 transition-opacity"
              >
                Get RingTap
              </Link>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
