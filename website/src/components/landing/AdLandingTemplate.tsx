import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import {
  APP_STORE_BADGE_SRC,
  APP_STORE_URL,
  type AdLandingConfig,
  adLandingCanonical,
} from "@/data/adLandingPages";
import { Check, Rocket, ShoppingBag } from "lucide-react";
import Link from "next/link";

const TRUST_POINTS = [
  "Recipients open your page in the browser—no RingTap install required",
  "Built-in NFC writer in the iOS app (Android roadmap)",
  "Free tier for your link, QR, and core profile",
] as const;

type Props = { config: AdLandingConfig };

export function AdLandingTemplate({ config }: Props) {
  const canonical = adLandingCanonical(config.slug);
  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: config.title,
    description: config.description,
    url: canonical,
    isPartOf: { "@type": "WebSite", name: "RingTap", url: "https://www.ringtap.me" },
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.ringtap.me" },
      { "@type": "ListItem", position: 2, name: "Landing", item: "https://www.ringtap.me/landing" },
      { "@type": "ListItem", position: 3, name: config.h1.slice(0, 48), item: canonical },
    ],
  };
  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "RingTap",
    applicationCategory: "BusinessApplication",
    operatingSystem: "iOS, Android",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: config.description,
    url: canonical,
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: config.gradient }}>
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: config.glowColor }}
        aria-hidden
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <Header variant="home" />
      <main className="relative z-10">
        <section className="mx-auto max-w-4xl px-6 pt-16 pb-20 md:pt-20 md:pb-28 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-light mb-5">
            {config.eyebrow}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl text-balance leading-[1.15]">
            {config.h1}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-light leading-relaxed text-pretty">
            {config.subhead}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
            <Link
              href={config.signupHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-7 text-background text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-black/30"
            >
              <Rocket className="h-4 w-4" />
              Start free
            </Link>
            <Link
              href="/store"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border-light bg-surface/60 px-7 text-foreground text-sm font-semibold hover:border-accent backdrop-blur-sm transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              Shop NFC rings
            </Link>
          </div>
          <div className="mt-10 flex flex-col items-center gap-3">
            <span className="text-xs text-muted uppercase tracking-wider">Get the app</span>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block transition-opacity hover:opacity-90"
              aria-label="Download RingTap on the App Store"
            >
              <img src={APP_STORE_BADGE_SRC} alt="Download on the App Store" className="h-11 w-auto" />
            </a>
          </div>
          <ul className="mx-auto mt-12 max-w-xl space-y-3 text-left">
            {TRUST_POINTS.map((t) => (
              <li key={t} className="flex gap-3 text-sm text-muted-light">
                <Check className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-t border-border-light/40 bg-surface/40 backdrop-blur-md px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold text-foreground md:text-3xl text-balance">
              Why teams switch from paper
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-muted-light text-sm md:text-base">
              One profile beats retyping links—especially when you&apos;re on a job site, in a van, or between appointments.
            </p>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {config.benefits.map((b) => (
                <div
                  key={b.title}
                  className="rounded-2xl border border-border-light/80 bg-surface-elevated/80 p-6 text-left hover:border-border-light transition-colors"
                >
                  <div className={`inline-flex rounded-lg p-2.5 ${b.iconClass}`}>
                    <b.Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">{b.title}</h3>
                  <p className="mt-2 text-sm text-muted-light leading-relaxed">{b.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 md:py-24">
          <div className="mx-auto max-w-2xl rounded-2xl border border-accent/25 bg-surface-elevated/90 p-8 md:p-10 text-center backdrop-blur-sm">
            <h2 className="text-xl font-bold text-foreground md:text-2xl">Ready to test in the wild?</h2>
            <p className="mt-3 text-sm text-muted-light">
              Use this page for paid campaigns—each URL is a clean, crawlable landing with its own title and description.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href={config.signupHref}
                className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-xl bg-accent px-6 text-sm font-semibold text-background hover:opacity-90"
              >
                Create your free profile
              </Link>
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-full sm:w-auto items-center justify-center rounded-xl border border-border-light px-6 text-sm font-semibold text-foreground hover:border-accent transition-colors"
              >
                App Store
              </a>
            </div>
          </div>
          <p className="mx-auto mt-10 max-w-xl text-center text-xs text-muted">
            <Link href="/" className="text-muted-light hover:text-accent underline-offset-2 hover:underline">
              RingTap home
            </Link>
            {" · "}
            <Link href="/privacy" className="text-muted-light hover:text-accent underline-offset-2 hover:underline">
              Privacy
            </Link>
            {" · "}
            <Link href="/terms" className="text-muted-light hover:text-accent underline-offset-2 hover:underline">
              Terms
            </Link>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
