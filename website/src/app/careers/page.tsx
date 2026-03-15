import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TrustBanner } from "@/components/TrustBanner";
import {
  ArrowLeft,
  Megaphone,
  Users,
  PenLine,
  Code2,
  Sparkles,
  Handshake,
  Zap,
  Globe,
  Heart,
  Mail,
  MapPin,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://www.ringtap.me";

export const metadata: Metadata = {
  title: "Careers at RingTap — Join Us | Digital Business Card",
  description:
    "Join RingTap and help us build the best digital business card app. We're hiring Promoters, Community, Content, Engineering, and more. Remote-friendly. Make networking one tap.",
  keywords: [
    "RingTap careers",
    "RingTap jobs",
    "digital business card jobs",
    "NFC app hiring",
    "startup careers",
    "remote jobs",
  ],
  openGraph: {
    title: "Careers at RingTap — Join Us",
    description: "Help us build the best digital business card. Hiring Promoters, Community, Engineering & more.",
    url: `${SITE_URL}/careers`,
    type: "website",
    siteName: "RingTap",
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: "RingTap Careers" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Careers at RingTap — Join Us",
    description: "Help us build the best digital business card. Hiring Promoters, Community, Engineering & more.",
  },
  alternates: { canonical: `${SITE_URL}/careers` },
  robots: { index: true, follow: true },
  category: "technology",
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Careers", item: `${SITE_URL}/careers` },
  ],
};

const jobPostingJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "RingTap Careers",
  description: "Open positions at RingTap",
  url: `${SITE_URL}/careers`,
  numberOfItems: 6,
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Brand Promoter" },
    { "@type": "ListItem", position: 2, name: "Community Manager" },
    { "@type": "ListItem", position: 3, name: "Content Creator" },
    { "@type": "ListItem", position: 4, name: "Product Designer" },
    { "@type": "ListItem", position: 5, name: "Software Engineer" },
    { "@type": "ListItem", position: 6, name: "Partnerships Lead" },
  ],
};

const ROLES = [
  {
    id: "promoter",
    title: "Brand Promoter",
    icon: Megaphone,
    iconColor: "text-amber-500",
    tag: "High priority",
    description:
      "Spread the word about RingTap at events, conferences, and online. You'll demo NFC rings, run booths, and help people discover one-tap contact sharing. Perfect for outgoing networkers who love tech.",
    perks: ["Flexible hours", "Event travel", "Commission on signups"],
  },
  {
    id: "community",
    title: "Community Manager",
    icon: Users,
    iconColor: "text-blue-500",
    description:
      "Build and nurture our user community. Run Discord, social channels, and in-app engagement. Turn users into advocates and gather feedback to make RingTap better than Popl, Blinq, and the rest.",
    perks: ["Remote-first", "Creative freedom", "Direct user impact"],
  },
  {
    id: "content",
    title: "Content Creator",
    icon: PenLine,
    iconColor: "text-emerald-500",
    description:
      "Create videos, tutorials, and social content that show how RingTap beats traditional business cards. SEO, TikTok, YouTube, LinkedIn—you'll own our content strategy and help us rank.",
    perks: ["Own the content calendar", "Equipment stipend", "Performance bonuses"],
  },
  {
    id: "designer",
    title: "Product Designer",
    icon: Sparkles,
    iconColor: "text-violet-500",
    description:
      "Design the digital business card experience users love. We want RingTap to feel premium, fast, and delightful—better UX than any competitor. You'll own flows from onboarding to Pro upgrade.",
    perks: ["End-to-end ownership", "Modern stack", "User research budget"],
  },
  {
    id: "engineer",
    title: "Software Engineer",
    icon: Code2,
    iconColor: "text-cyan-500",
    description:
      "Build features that make RingTap the best: NFC, QR, analytics, themes, contact sync. React Native, Next.js, Supabase. We ship fast and care about performance and polish.",
    perks: ["Remote", "Modern stack", "Equity-eligible"],
  },
  {
    id: "partnerships",
    title: "Partnerships Lead",
    icon: Handshake,
    iconColor: "text-orange-500",
    description:
      "Land deals with event organizers, universities, and companies. Get RingTap into conferences, career fairs, and corporate programs. Grow our B2B and affiliate channels.",
    perks: ["Commission structure", "Autonomy", "Strategic impact"],
  },
];

const WHY_RINGTAP = [
  {
    icon: Zap,
    title: "Ship fast",
    text: "Small team, big impact. Your ideas ship in weeks, not quarters.",
  },
  {
    icon: Globe,
    title: "Remote-first",
    text: "Work from anywhere. We care about output, not hours.",
  },
  {
    icon: Heart,
    title: "Build something people love",
    text: "We're replacing paper business cards. Real problem, real users.",
  },
];

const CAREERS_EMAIL = "careers@ringtap.me";

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingJsonLd) }}
      />
      <Header variant="home" />
      <TrustBanner />

      <main className="pt-24 pb-20 px-6" role="main">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-light hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            Careers at RingTap
          </h1>
          <p className="mt-4 text-muted-light text-lg leading-relaxed">
            We're building the best digital business card—faster, smarter, and more beautiful than Popl and the rest. Join us.
          </p>

          {/* Why RingTap */}
          <section className="mt-14" aria-labelledby="why-ringtap">
            <h2 id="why-ringtap" className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
              Why RingTap
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {WHY_RINGTAP.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-xl border border-border-light bg-surface p-4"
                  >
                    <Icon className="h-6 w-6 text-accent mb-2" />
                    <h3 className="font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-light">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Open roles */}
          <section className="mt-14" aria-labelledby="open-roles">
            <h2 id="open-roles" className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
              Open roles
            </h2>
            <p className="mt-4 text-muted-light">
              We're hiring across growth, product, and engineering. All roles are remote unless noted.
            </p>
            <div className="mt-6 space-y-6">
              {ROLES.map((role) => {
                const Icon = role.icon;
                return (
                  <article
                    key={role.id}
                    className="rounded-2xl border border-border-light bg-surface p-6 hover:border-border transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg bg-surface-elevated p-2 ${role.iconColor}`}>
                          <Icon className="h-5 w-5 text-current" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{role.title}</h3>
                          {role.tag && (
                            <span className="inline-block mt-1 text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                              {role.tag}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 text-muted-light leading-relaxed">{role.description}</p>
                    {role.perks && role.perks.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {role.perks.map((perk) => (
                          <li
                            key={perk}
                            className="text-xs text-muted-light bg-surface-elevated px-2.5 py-1 rounded-full"
                          >
                            {perk}
                          </li>
                        ))}
                      </ul>
                    )}
                    <a
                      href={`mailto:${CAREERS_EMAIL}?subject=Application: ${encodeURIComponent(role.title)}`}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
                    >
                      <Mail className="h-4 w-4" />
                      Apply for {role.title}
                    </a>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Apply CTA */}
          <section className="mt-14 rounded-2xl border border-border-light bg-surface p-8 text-center">
            <h2 className="text-xl font-semibold text-foreground">Don't see your role?</h2>
            <p className="mt-2 text-muted-light max-w-xl mx-auto">
              We're always looking for talented people. Tell us what you'd bring to RingTap.
            </p>
            <a
              href={`mailto:${CAREERS_EMAIL}?subject=General application`}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-background font-semibold hover:opacity-90 transition-opacity"
            >
              <Mail className="h-5 w-5" />
              Get in touch
            </a>
            <p className="mt-6 text-sm text-muted-light flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4" />
              Remote-first · US & international
            </p>
          </section>

          <div className="mt-12">
            <Link
              href="/#download"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-background font-semibold hover:opacity-90 transition-opacity"
            >
              Try RingTap
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
