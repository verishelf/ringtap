import { Header } from "@/components/Header";
import { MarketingMarquee } from "@/components/MarketingMarquee";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { SampleProfilePreview } from "@/components/SampleProfilePreview";
import { ShareSection } from "@/components/ShareSection";
import { TrustBanner } from "@/components/TrustBanner";
import { TypewriterHero } from "@/components/TypewriterHero";
import { PRODUCTS } from "@/data/products";
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
      <MarketingMarquee />
      <TrustBanner />

      {/* Hero — clear H1 and intro for SEO */}
      <section className="relative pt-32 pb-24 px-6 md:pt-40 md:pb-32" aria-label="Introduction">
        <div className="mx-auto max-w-4xl text-center">
          <TypewriterHero />
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
              href="https://apps.apple.com/app/ringtap"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-background font-semibold hover:bg-muted-light transition-colors"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              Download free
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=me.ringtap.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border-light px-6 text-foreground font-semibold hover:border-accent hover:bg-surface transition-colors"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.302 2.302-8.636-8.634z"
                  fill="currentColor"
                />
              </svg>
              Get on Google Play
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
                title: "Link your ring & share",
                description:
                  "In the app, use \"Link ring\" (Share → NFC or Settings → Manage ring) to write your profile URL to your NFC ring or card—no other apps needed. Tap to share, or show your QR code. Their browser opens your profile instantly.",
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

      {/* Sample profile preview */}
      <section id="sample-profile" className="border-t border-border-light/50 py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            Your profile, one tap
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-light">
            When someone taps your NFC ring or scans your QR code, they see your profile instantly—no app required.
          </p>
          <div className="mt-16">
            <SampleProfilePreview />
          </div>
        </div>
      </section>

      {/* Store products */}
      <section id="store" className="border-t border-border-light/50 py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            NFC rings & cards
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-light">
            Tap to share your profile. Rings and cards work with the RingTap app—one tap opens your ringtap.me link. From $19.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((product) => (
              <Link
                key={product.id}
                href="/store"
                className="group relative rounded-2xl border border-border-light bg-surface p-6 flex flex-col hover:border-accent transition-colors"
              >
                {(product.id === "classic" || product.id === "metal-card") && (
                  <span className="absolute top-4 right-4 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-background">
                    {product.id === "classic" ? "Bestseller" : "Popular"}
                  </span>
                )}
                <div className="flex h-24 w-full items-center justify-center rounded-xl bg-surface-elevated text-4xl text-accent mb-4">
                  {product.image}
                </div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                  {product.name}
                </h3>
                <p className="mt-2 text-sm text-muted-light leading-relaxed flex-1">
                  {product.description}
                </p>
                <p className="mt-4 text-xl font-bold text-accent">${product.price}</p>
                <span className="mt-4 text-sm font-semibold text-accent group-hover:underline">
                  Shop in store →
                </span>
              </Link>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href="/store"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-accent px-6 text-background font-semibold hover:bg-muted-light transition-colors"
            >
              View all products
            </Link>
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
                  "The app has a built-in NFC writer: link your profile to your ring or card in one tap (Share → NFC → Link ring, or Settings → Manage ring). No other apps needed. Then tap to share, or show your QR code. Your profile opens in their browser instantly.",
              },
              {
                title: "Free & Pro",
                description:
                  "Free: profile, 2 links, link ring (NFC writer), QR, contacts, messages. Pro: unlimited links, theme (accent, button shape, Pro border), video intro, analytics. Your ringtap.me page uses your theme. Monthly or yearly billing via Stripe; cancel anytime.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border-light bg-surface p-6">
                <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-light leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>

          {/* Everything in the app */}
          <h2 className="text-center text-2xl font-bold text-foreground mt-20 mb-6">
            Everything in the app
          </h2>
          <p className="mx-auto max-w-2xl text-center text-muted-light text-sm mb-10">
            One place to build your card, link your ring, share, and stay in touch.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-border-light bg-surface p-5">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                <h3 className="text-base font-semibold text-foreground">Profile</h3>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-light">
                <li>Name, photo, title, bio, username (ringtap.me/you)</li>
                <li>Social links (Instagram, TikTok, LinkedIn, X, etc.)</li>
                <li>Payment links (Cash App, Venmo, PayPal, Zelle)</li>
                <li>Theme: accent color, button shape (Pro: border color)</li>
                <li>Video intro (Pro), copy profile link</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border-light bg-surface p-5">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12a3 3 0 106 0 3 3 0 00-6 0z" />
                </svg>
                <h3 className="text-base font-semibold text-foreground">Link your ring</h3>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-light">
                <li>In-app NFC writer — write your profile URL to ring or card</li>
                <li>No Shortcuts or third-party apps needed</li>
                <li>Claim ring (link hardware to your account)</li>
                <li>Manage ring in Settings</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border-light bg-surface p-5">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                <h3 className="text-base font-semibold text-foreground">Share</h3>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-light">
                <li>QR code — generate, save image, share</li>
                <li>Share with NFC — how-to, Link ring, test your link</li>
                <li>Tap to share from home (opens share flow)</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border-light bg-surface p-5">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <h3 className="text-base font-semibold text-foreground">Contacts</h3>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-light">
                <li>Saved contacts (people you’ve saved from profiles)</li>
                <li>Scanned contacts (from NFC/QR scans)</li>
                <li>View any profile by ID, save contact, open in messages</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border-light bg-surface p-5">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
                <h3 className="text-base font-semibold text-foreground">Links</h3>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-light">
                <li>Add, edit, delete custom links (social, payment, other)</li>
                <li>Free: 2 links; Pro: unlimited</li>
                <li>Reorder and show on your profile & ringtap.me</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border-light bg-surface p-5">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
                <h3 className="text-base font-semibold text-foreground">Messages</h3>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-light">
                <li>Conversations with contacts who have the app</li>
                <li>Recent messages on home, full list in Messages tab</li>
                <li>Push notifications (optional), delete conversation</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border-light bg-surface p-5">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                <h3 className="text-base font-semibold text-foreground">Analytics (Pro)</h3>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-light">
                <li>Profile views, link clicks, NFC taps, QR scans</li>
                <li>Chart by day; 7, 30, or 90 day range</li>
                <li>This week taps & views on home dashboard</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border-light bg-surface p-5">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-base font-semibold text-foreground">Settings</h3>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-light">
                <li>Appearance (light / dark)</li>
                <li>Notifications (new messages)</li>
                <li>Manage ring, manage subscription, upgrade to Pro</li>
                <li>About, sign out, delete account</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border-light bg-surface p-5">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                <h3 className="text-base font-semibold text-foreground">Web & store</h3>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-muted-light">
                <li>Your ringtap.me page matches your app theme (Pro)</li>
                <li>Store: NFC rings & cards (ringtap.me/store)</li>
                <li>Upgrade to Pro on web (monthly or yearly)</li>
              </ul>
            </div>
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
            Free forever for your profile and 2 links. Pro adds unlimited links, your theme on the web, and analytics. Choose monthly or yearly billing.
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
              <Link
                href="/signup?plan=free"
                className="mt-8 block w-full rounded-xl border border-border-light py-3 text-center text-sm font-semibold text-foreground hover:border-accent hover:bg-surface-elevated transition-colors"
              >
                Start free — create account on web
              </Link>
            </div>
            <div className="rounded-2xl border-2 border-accent bg-surface-elevated p-8 relative">
              <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-background">
                Pro
              </span>
              <h3 className="text-xl font-bold text-foreground">Pro</h3>
              <p className="mt-2 text-2xl font-bold text-accent">$9<span className="text-base font-normal text-muted-light">/month</span></p>
              <p className="mt-0.5 text-sm text-muted-light">or $99/year <span className="text-accent font-medium">(save when you pay yearly)</span></p>
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
              <Link
                href="/signup?plan=pro"
                className="mt-8 block w-full rounded-xl bg-accent py-3 text-center text-sm font-semibold text-background hover:bg-muted-light transition-colors"
              >
                Create account & pay with Stripe
              </Link>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-muted">
            Monthly or yearly billing via Stripe. Cancel anytime. Free plan never expires.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="border-t border-border-light/50 py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            What people say about RingTap
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-light">
            Real users sharing how RingTap fits into their networking and events.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                quote: "I got tired of typing my LinkedIn at conferences. Now I tap my ring and my profile opens on their phone. So much faster and it always looks polished.",
                name: "Jordan M.",
                role: "Sales lead, tech events",
              },
              {
                quote: "The in-app NFC writer is a game changer. I didn't need Shortcuts or another app—just Link ring in the app and hold my card to my phone. Done.",
                name: "Sam K.",
                role: "Freelance designer",
              },
              {
                quote: "I use the QR code on my laptop sticker and the ring when I'm in person. One link for everything. Pro analytics let me see how many people actually viewed my profile.",
                name: "Alex R.",
                role: "Startup founder",
              },
            ].map((t, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border-light bg-surface p-6 flex flex-col"
              >
                <p className="text-foreground text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 pt-4 border-t border-border-light">
                  <p className="font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-muted-light text-xs mt-0.5">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
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
                a: "Use the RingTap app's built-in NFC writer. Set a username in Profile, then go to Share → Share with NFC → \"Link ring\" (or Settings → Manage ring). Hold your ring or card to the back of your phone; the app writes your ringtap.me/username URL. No other apps needed.",
              },
              {
                q: "What's included in Pro?",
                a: "Pro is $9/month or $99/year (save when you pay yearly). It includes unlimited links, profile themes (accent color, button shape, and Pro border color on your card and avatar), your theme applied on ringtap.me so the web matches the app, a short video intro, and analytics (profile views, link clicks, NFC taps, QR scans—including taps and views this week on your dashboard). Billing is handled securely by Stripe; you can cancel anytime.",
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
          <div className="mt-10 pt-10 border-t border-border-light/50">
            <ShareSection />
          </div>
        </div>
      </section>

      {/* Stay updated */}
      <section className="border-t border-border-light/50 py-16 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold text-foreground">
            Get tips & early access
          </h2>
          <p className="mt-2 text-sm text-muted-light">
            We&apos;ll send updates on new features, NFC tips, and exclusive offers. No spam.
          </p>
          <div className="mt-6">
            <NewsletterSignup />
          </div>
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
            <a href="#sample-profile" className="text-sm text-muted-light hover:text-foreground transition-colors">
              Sample profile
            </a>
            <a href="#store" className="text-sm text-muted-light hover:text-foreground transition-colors">
              Products
            </a>
            <Link href="/store" className="text-sm text-muted-light hover:text-foreground transition-colors">
              Store
            </Link>
            <a href="#pricing" className="text-sm text-muted-light hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#testimonials" className="text-sm text-muted-light hover:text-foreground transition-colors">
              Testimonials
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
            <Link href="/demo" className="text-sm text-muted-light hover:text-foreground transition-colors">
              NFC demo
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
