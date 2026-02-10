import { Header } from "@/components/Header";
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://www.ringtap.me";

export const metadata: Metadata = {
  title: "RingTap — Your Digital Business Card | NFC & QR Sharing",
  description:
    "RingTap is your digital business card. Share your profile instantly with NFC rings, QR codes, or your link—ringtap.me/you. Custom themes, analytics, and your style on the web. Free to start, works on iPhone and Android.",
  keywords: [
    "digital business card",
    "NFC business card",
    "NFC ring",
    "QR code business card",
    "ringtap",
    "contact sharing",
    "profile analytics",
  ],
  openGraph: {
    title: "RingTap — Your Digital Business Card. One Tap.",
    description: "Share your profile with NFC and QR. Your link, your theme: ringtap.me/you. Analytics, custom colors, free to start.",
    url: SITE_URL,
    type: "website",
  },
  alternates: { canonical: SITE_URL },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header variant="home" />

      {/* Hero — clear H1 and intro for SEO */}
      <section className="relative pt-32 pb-24 px-6 md:pt-40 md:pb-32" aria-label="Introduction">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Your digital business card.{" "}
            <span className="text-accent">At your fingertip.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-light max-w-2xl mx-auto leading-relaxed">
            Share your profile instantly with NFC and QR. Wear it on your ring or
            keep it on your phone—your name, photo, links, and contact info in one
            link. No typing, no paper, no lost cards.
          </p>
          <ul className="mt-8 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-muted-light">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              Free to start
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              NFC rings & QR — one tap to share
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              Your link: ringtap.me/you
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
              Pro: your theme & analytics on the web
            </li>
          </ul>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#download"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-background font-semibold hover:bg-muted-light transition-colors"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              App Store
            </a>
            <a
              href="#download"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border-light px-6 text-foreground font-semibold hover:border-accent hover:bg-surface transition-colors"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.634z"
                  fill="currentColor"
                />
              </svg>
              Google Play
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-border-light/50 py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-light">
            Set up once. Share everywhere.
          </p>
          <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "1",
                title: "Create your profile",
                description:
                  "Download the app and add your name, photo, title, bio, and contact details. Choose a username—your link will be ringtap.me/username.",
              },
              {
                step: "2",
                title: "Add your links",
                description:
                  "Connect Instagram, LinkedIn, your website, or custom buttons. Free includes 2 links; Pro gives you unlimited links and payment options.",
              },
              {
                step: "3",
                title: "Share with NFC or QR",
                description:
                  "Tap your NFC ring or card to someone's phone, or show your QR code. Their browser opens your profile instantly—no app required for them.",
              },
              {
                step: "4",
                title: "Save contacts & insights",
                description:
                  "Keep a list of people you've met and see recent messages in the app. On Pro, your dashboard shows taps and views this week, and the Analytics tab breaks down profile views, link clicks, NFC taps, and QR scans.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-accent text-sm font-bold text-accent">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-light leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border-light/50 py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            Built for how you network
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-light">
            One link for your portfolio, socials, and contact. Update anytime—your ringtap.me link stays the same.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "One link, everything",
                description:
                  "ringtap.me/you—your name, photo, title, bio, social links, contact info, and custom buttons. One URL for your whole presence. Recipients can save your contact, follow your socials, or visit your site without opening the app.",
              },
              {
                title: "NFC & QR",
                description:
                  "Tap your NFC ring or card to someone's phone, or let them scan your QR code. Your profile opens in their browser instantly—no typing, no searching. Works with any NFC-capable ring or card you program with your ringtap.me URL.",
              },
              {
                title: "Free & Pro",
                description:
                  "Free: profile, 2 links, QR, NFC sharing. Pro: unlimited links, custom theme (accent color, button shape, Pro border on card and avatar), video intro, and analytics. Your ringtap.me page uses your theme so you look the same everywhere. Billing via Stripe; cancel anytime.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border-light bg-surface p-6">
                <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-light leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border-light/50 py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            Simple pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-light">
            Free forever for your profile and 2 links. Pro adds unlimited links, your theme on the web, and analytics (taps, views, clicks).
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            <div className="rounded-2xl border border-border-light bg-surface p-8">
              <h3 className="text-xl font-bold text-foreground">Free</h3>
              <p className="mt-2 text-3xl font-bold text-foreground">$0</p>
              <p className="mt-1 text-sm text-muted-light">/ forever</p>
              <ul className="mt-6 space-y-3 text-sm text-muted-light">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  Profile & ringtap.me/you URL
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  Up to 2 links
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  NFC & QR sharing
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  Scanned contacts
                </li>
              </ul>
              <a
                href="#download"
                className="mt-8 block w-full rounded-xl border border-border-light py-3 text-center text-sm font-semibold text-foreground hover:border-accent hover:bg-surface-elevated transition-colors"
              >
                Get started free
              </a>
            </div>
            <div className="rounded-2xl border-2 border-accent bg-surface-elevated p-8 relative">
              <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-background">
                Pro
              </span>
              <h3 className="text-xl font-bold text-foreground">Pro</h3>
              <p className="mt-2 text-3xl font-bold text-accent">$9</p>
              <p className="mt-1 text-sm text-muted-light">/ month</p>
              <ul className="mt-6 space-y-3 text-sm text-muted-light">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  Unlimited links
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  Profile theme (accent, shape, Pro border)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  Your theme on ringtap.me (web matches app)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  Video intro (~20 sec)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  Analytics (views, taps, clicks, NFC, QR)
                </li>
              </ul>
              <a
                href="#download"
                className="mt-8 block w-full rounded-xl bg-accent py-3 text-center text-sm font-semibold text-background hover:bg-muted-light transition-colors"
              >
                Upgrade to Pro
              </a>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-muted">
            Billing via Stripe. Cancel anytime. Free plan never expires.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border-light/50 py-24 px-6">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            Frequently asked questions
          </h2>
          <dl className="mt-12 space-y-8">
            {[
              {
                q: "Do I need an NFC ring or card?",
                a: "No. You can share your profile with the QR code in the app, or send your ringtap.me link by text, email, or social. NFC rings and cards are optional—they just make it even faster to tap and share at in-person events.",
              },
              {
                q: "Do people need the RingTap app to view my profile?",
                a: "No. Your profile opens in their phone's browser. They can view your link, save your contact, and tap your links without installing anything.",
              },
              {
                q: "What's my profile URL?",
                a: "After you set a username in the app, your link is ringtap.me/yourusername. You can share that link anywhere—email signature, social bio, or NFC/QR.",
              },
              {
                q: "How do I add my profile to an NFC ring or card?",
                a: "Write your ringtap.me/username URL to the NFC tag using your phone's built-in NFC tools (e.g. Shortcuts on iOS, NFC Tools on Android) or a compatible app. Then when someone taps your ring or card to their phone, your profile opens.",
              },
              {
                q: "What's included in Pro?",
                a: "Pro ($9/month) includes unlimited links, profile themes (accent color, button shape, and Pro border color on your card and avatar), your theme applied on ringtap.me so the web matches the app, a short video intro, and analytics (profile views, link clicks, NFC taps, QR scans—including taps and views this week on your dashboard). Billing is handled securely by Stripe; you can cancel anytime.",
              },
            ].map((faq) => (
              <div key={faq.q}>
                <dt className="text-base font-semibold text-foreground">
                  {faq.q}
                </dt>
                <dd className="mt-2 text-sm text-muted-light leading-relaxed">
                  {faq.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CTA / Download */}
      <section id="download" className="border-t border-border-light/50 py-24 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Get RingTap
          </h2>
          <p className="mt-4 text-muted-light">
            Download the app, create your profile, and share your ringtap.me link
            with anyone. Free to start—no credit card required.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
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
          <p className="mt-6 text-xs text-muted">
            Free to start. Pro unlocks unlimited links, your theme on ringtap.me, and analytics. Billing via Stripe.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-light/50 py-12 px-6">
        <div className="mx-auto max-w-6xl flex flex-col items-center justify-between gap-6 sm:flex-row">
          <a href="#" className="text-sm font-bold text-foreground">
            RingTap
          </a>
          <nav className="flex flex-wrap items-center justify-center gap-6" aria-label="Footer navigation">
            <a href="#features" className="text-sm text-muted-light hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-muted-light hover:text-foreground transition-colors">
              How it works
            </a>
            <Link href="/store" className="text-sm text-muted-light hover:text-foreground transition-colors">
              Store
            </Link>
            <a href="#pricing" className="text-sm text-muted-light hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-sm text-muted-light hover:text-foreground transition-colors">
              FAQ
            </a>
            <Link href="/privacy" className="text-sm text-muted-light hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-muted-light hover:text-foreground transition-colors">
              Terms of Use
            </Link>
            <a href="#download" className="text-sm text-muted-light hover:text-foreground transition-colors">
              Download
            </a>
          </nav>
        </div>
        <p className="mx-auto mt-8 max-w-6xl text-center text-xs text-muted">
          Your digital business card. One tap. ringtap.me
        </p>
        <div className="mx-auto mt-4 max-w-6xl flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted">
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          <span className="text-border-light">·</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <span className="text-border-light">·</span>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Use</Link>
        </div>
      </footer>
    </div>
  );
}
