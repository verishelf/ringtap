import { FadeInOnScroll } from "@/components/FadeInOnScroll";
import { Header } from "@/components/Header";
import { MarketingMarquee } from "@/components/MarketingMarquee";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { ParallaxHero } from "@/components/ParallaxHero";
import { SampleProfilePreview } from "@/components/SampleProfilePreview";
import { ShareSection } from "@/components/ShareSection";
import { TrustBanner } from "@/components/TrustBanner";
import { TypewriterHero } from "@/components/TypewriterHero";
import { PRODUCTS } from "@/data/products";
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://www.ringtap.me";

const FAQ_ITEMS = [
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
    a: "Pro is $9/month or $99/year (save when you pay yearly). It includes unlimited links, profile themes (accent color, button shape, and Pro border color on your card and avatar), 12 typography fonts (Akronim, Fugaz One, Rubik Glitch, Rubik Puddles, Trade Winds, and more), custom QR code with your logo in the center and theme colors, sync contacts to your phone, your theme applied on ringtap.me so the web matches the app, a short video intro, and analytics (profile views, link clicks, NFC taps, QR scans—including taps and views this week on your dashboard). Billing is handled securely by Stripe; you can cancel anytime.",
  },
] as const;

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export const metadata: Metadata = {
  title: "RingTap — Best Digital Business Card App | NFC & QR Sharing",
  description:
    "RingTap is the best digital business card app. Share your profile instantly with NFC rings, QR codes, or your link—ringtap.me/you. Free to start. Custom themes, analytics, works on iPhone and Android. No app needed for recipients.",
  keywords: [
    "digital business card",
    "best digital business card app",
    "NFC business card",
    "NFC ring",
    "QR code business card",
    "ringtap",
    "contact sharing",
    "profile analytics",
    "free digital business card",
  ],
  openGraph: {
    title: "RingTap — Best Digital Business Card App. One Tap.",
    description: "Share your profile with NFC and QR. Your link, your theme: ringtap.me/you. Free to start. Analytics, custom colors.",
    url: SITE_URL,
    type: "website",
  },
  alternates: { canonical: SITE_URL },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Header variant="home" />
      <main>
      <MarketingMarquee />
      <TrustBanner />

      {/* 1. Hero — Identity + Reason to exist */}
      <ParallaxHero>
        <div className="mx-auto max-w-4xl text-center">
          <TypewriterHero />
          <p className="mt-6 text-lg text-muted-light max-w-2xl mx-auto leading-relaxed">
            RingTap is your digital business card. One tap shares your name, photo, links, and contact—no typing, no paper, no lost cards. Your ringtap.me link works everywhere.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup?plan=free"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-background font-semibold hover:bg-muted-light transition-colors"
            >
              Start Free
            </Link>
            <Link
              href="/store"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border-light px-6 text-foreground font-semibold hover:border-accent hover:bg-surface transition-colors"
            >
              Buy Your Ring
            </Link>
          </div>
        </div>
      </ParallaxHero>

      {/* 2. Demo — Show the tap moment */}
      <section id="demo" className="border-t border-border-light/50 py-24 px-6">
        <FadeInOnScroll className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            See it in action
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-light">
            Tap your ring. Their phone opens your profile. Instantly.
          </p>
          <div className="mt-12 flex flex-col items-center">
            <Link
              href="/demo"
              className="group relative block w-full max-w-2xl rounded-2xl overflow-hidden border border-border-light bg-surface-elevated hover:border-accent transition-colors"
            >
              <div className="aspect-video bg-surface flex items-center justify-center">
                <video
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                >
                  <source src="/demo.mp4" type="video/mp4" />
                </video>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                <div className="rounded-full bg-accent/90 p-4 text-background">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </Link>
            <div className="mt-8">
              <SampleProfilePreview />
            </div>
          </div>
        </FadeInOnScroll>
      </section>

      {/* 3. Benefits — Why this improves their networking */}
      <section id="benefits" className="border-t border-border-light/50 py-24 px-6">
        <FadeInOnScroll className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            Better networking, less friction
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-light">
            Stop fumbling for cards or typing usernames. Share your whole presence in one tap.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Instant first impression",
                description:
                  "Your profile opens in their browser instantly. No app install. They see your name, photo, links, and contact—and can save you or follow you right away.",
              },
              {
                title: "Always up to date",
                description:
                  "Change your bio, add a link, or change your title—your ringtap.me link stays the same. Everyone who taps you always gets your latest info.",
              },
              {
                title: "Works everywhere",
                description:
                  "NFC ring, QR code, or your link. Share at conferences, events, or over coffee. Recipients see your profile in their browser—no app required.",
              },
            ].map((item, i) => (
              <FadeInOnScroll key={item.title} delay={i * 80}>
                <div className="rounded-2xl border border-border-light bg-surface p-6">
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-light leading-relaxed">{item.description}</p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </FadeInOnScroll>
      </section>

      {/* 4. Who it's for — Persona-specific relevance */}
      <section id="who-its-for" className="border-t border-border-light/50 py-24 px-6">
        <FadeInOnScroll className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            Built for people who connect
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-light">
            Whether you're at a conference, networking event, or meeting a new client.
          </p>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { role: "Sales & BD", desc: "Close leads faster. Tap your ring to share your LinkedIn and calendar—no typing." },
              { role: "Founders & startups", desc: "Your profile is your pitch. One link for investors, partners, and customers." },
              { role: "Freelancers & creatives", desc: "Portfolio, socials, and contact in one tap. QR on your laptop, ring on your hand." },
              { role: "Event professionals", desc: "Conferences, trade shows, meetups. Share your whole presence without fumbling for cards." },
            ].map((item, i) => (
              <FadeInOnScroll key={item.role} delay={i * 80}>
                <div className="rounded-2xl border border-border-light bg-surface p-5">
                  <h3 className="text-base font-semibold text-foreground">{item.role}</h3>
                  <p className="mt-2 text-sm text-muted-light leading-relaxed">{item.desc}</p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </FadeInOnScroll>
      </section>

      {/* 5. Features — Clean visual breakdown */}
      <section id="features" className="border-t border-border-light/50 py-24 px-6">
        <FadeInOnScroll className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            Everything you need
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-light">
            One link for your portfolio, socials, and contact. Update anytime—ringtap.me/you stays the same.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "One link, everything",
                description:
                  "ringtap.me/you—name, photo, title, bio, social links, contact info, custom buttons. Recipients save you, follow you, or visit your site without opening the app.",
              },
              {
                title: "NFC & QR",
                description:
                  "Built-in NFC writer: link your profile to your ring or card in one tap. No other apps. Tap to share or show your QR. Pro: custom QR with your logo and colors.",
              },
              {
                title: "Profile & theme",
                description:
                  "12 typography fonts, accent color, button shape. Pro: border color, video intro, theme on ringtap.me, sync contacts to phone, analytics.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border-light bg-surface p-6">
                <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-light leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </FadeInOnScroll>
      </section>

      {/* 6. Pricing — Clear, confident, simple */}
      <section id="pricing" className="border-t border-border-light/50 py-24 px-6">
        <FadeInOnScroll className="mx-auto max-w-4xl">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            Simple pricing
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-light">
            Free forever for your profile and 2 links. Pro adds unlimited links, your theme on the web, and analytics.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            <FadeInOnScroll delay={0}>
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
                  Contacts & messages
                </li>
              </ul>
              <Link
                href="/signup?plan=free"
                className="mt-8 block w-full rounded-xl border border-border-light py-3 text-center text-sm font-semibold text-foreground hover:border-accent hover:bg-surface-elevated transition-colors"
              >
                Start Free
              </Link>
            </div>
            </FadeInOnScroll>
            <FadeInOnScroll delay={100}>
            <div className="rounded-2xl border-2 border-accent bg-surface-elevated p-8 relative">
              <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-background">
                Pro
              </span>
              <h3 className="text-xl font-bold text-foreground">Pro</h3>
              <p className="mt-2 text-2xl font-bold text-accent">$9<span className="text-base font-normal text-muted-light">/month</span></p>
              <p className="mt-0.5 text-sm text-muted-light">or $99/year <span className="text-accent font-medium">(save yearly)</span></p>
              <ul className="mt-6 space-y-3 text-sm text-muted-light">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  Unlimited links
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  Theme, 12 fonts, custom QR with logo
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  Sync contacts to phone, video intro
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  Analytics (views, taps, clicks)
                </li>
              </ul>
              <Link
                href="/signup?plan=pro"
                className="mt-8 block w-full rounded-xl bg-accent py-3 text-center text-sm font-semibold text-background hover:bg-muted-light transition-colors"
              >
                Start Pro
              </Link>
            </div>
            </FadeInOnScroll>
          </div>
          <p className="mt-8 text-center text-xs text-muted">
            Monthly or yearly via Stripe. Cancel anytime. Free plan never expires.
          </p>
        </FadeInOnScroll>
      </section>

      {/* 7. Social proof — Reviews + screenshots */}
      <section id="testimonials" className="border-t border-border-light/50 py-24 px-6">
        <FadeInOnScroll className="mx-auto max-w-5xl">
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
              <FadeInOnScroll key={i} delay={i * 80}>
                <div className="rounded-2xl border border-border-light bg-surface p-6 flex flex-col">
                  <p className="text-foreground text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-4 pt-4 border-t border-border-light">
                    <p className="font-semibold text-foreground text-sm">{t.name}</p>
                    <p className="text-muted-light text-xs mt-0.5">{t.role}</p>
                  </div>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </FadeInOnScroll>
      </section>

      {/* 8. CTA — Start Free or Buy Your Ring */}
      <section id="cta" className="border-t border-border-light/50 py-24 px-6">
        <FadeInOnScroll className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Get started
          </h2>
          <p className="mt-4 text-muted-light">
            Create your profile in minutes. Free to start—no credit card required.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup?plan=free"
              className="inline-flex h-14 items-center gap-3 rounded-xl bg-accent px-8 text-background font-semibold hover:bg-muted-light transition-colors"
            >
              Start Free
            </Link>
            <Link
              href="/store"
              className="inline-flex h-14 items-center gap-3 rounded-xl border-2 border-accent px-8 text-foreground font-semibold hover:bg-accent hover:text-background transition-colors"
            >
              Buy Your Ring
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-light">
            Or download the app:{" "}
            <a href="https://apps.apple.com/app/ringtap" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">App Store</a>
            {" · "}
            <a href="https://play.google.com/store/apps/details?id=me.ringtap.app" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Google Play</a>
          </p>
          <div className="mt-10 pt-10 border-t border-border-light/50">
            <ShareSection />
          </div>
        </FadeInOnScroll>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border-light/50 py-24 px-6">
        <FadeInOnScroll className="mx-auto max-w-2xl">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            Frequently asked questions
          </h2>
          <dl className="mt-12 space-y-8">
            {FAQ_ITEMS.map((faq) => (
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
        </FadeInOnScroll>
      </section>

      {/* Store products — compact, for Buy Your Ring */}
      <section id="store" className="border-t border-border-light/50 py-24 px-6">
        <FadeInOnScroll className="mx-auto max-w-6xl">
          <h2 className="text-center text-3xl font-bold text-foreground md:text-4xl">
            NFC rings & cards
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-light">
            Tap to share your profile. Rings and cards work with the RingTap app—one tap opens your ringtap.me link. From $19.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((product, i) => (
              <FadeInOnScroll key={product.id} delay={i * 100}>
                <Link
                  href="/store"
                  className="group relative rounded-2xl border border-border-light bg-surface p-6 flex flex-col hover:border-accent transition-colors block"
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
              </FadeInOnScroll>
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
        </FadeInOnScroll>
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
            <a href="#demo" className="text-sm text-muted-light hover:text-foreground transition-colors">
              Demo
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
            <a href="#cta" className="text-sm text-muted-light hover:text-foreground transition-colors">
              Get started
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
      </main>
    </div>
  );
}
