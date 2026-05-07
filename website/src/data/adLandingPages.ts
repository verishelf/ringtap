import type { LucideIcon } from "lucide-react";
import { CalendarCheck, QrCode, Sparkles, Star, Zap } from "lucide-react";

const SITE_URL = "https://www.ringtap.me";

export const APP_STORE_URL = "https://apps.apple.com/us/app/ringtap-me/id6758565822";

export const APP_STORE_BADGE_SRC =
  "https://tools.applemediaservices.com/api/badges/download-on-the-app-store/white/en-us?size=250x83&releaseDate=1277769600";

export const AD_LANDING_SLUGS = ["service-pros", "nfc-tap", "free-digital-card"] as const;

export type AdLandingSlug = (typeof AD_LANDING_SLUGS)[number];

export type AdLandingBenefit = {
  title: string;
  body: string;
  Icon: LucideIcon;
  iconClass: string;
};

export type AdLandingConfig = {
  slug: AdLandingSlug;
  title: string;
  description: string;
  keywords: string[];
  h1: string;
  subhead: string;
  gradient: string;
  glowColor: string;
  benefits: AdLandingBenefit[];
  signupHref: string;
  eyebrow: string;
};

/** Distinct angles for A/B ad tests; each URL is canonical and keyword-targeted. */
export const AD_LANDING_PAGES: Record<AdLandingSlug, AdLandingConfig> = {
  "service-pros": {
    slug: "service-pros",
    title: "RingTap for Service Pros — Bookings, Reviews & Contact | Free",
    description:
      "Digital business card for cleaners, detailers, and trades. One ringtap.me link for scheduling, Google reviews, and tap-to-save contact. Free. NFC ring optional.",
    keywords: [
      "digital business card for small business",
      "service business NFC card",
      "cleaner business card app",
      "mobile detailing contact card",
      "QR code for contractors",
    ],
    eyebrow: "Built for people who work on-site",
    h1: "Turn every job into a rebooking—and a five-star review",
    subhead:
      "RingTap is the client-facing profile you share in seconds: booking link, review link, phone, and social—one short URL. Tap with NFC, show a QR, or text ringtap.me/you.",
    gradient:
      "linear-gradient(165deg, #0A0A0B 0%, #0a1214 30%, #0d1816 55%, #0A0A0B 100%)",
    glowColor: "rgba(52, 211, 153, 0.12)",
    signupHref: "/signup?plan=free",
    benefits: [
      {
        title: "Same link after every visit",
        body: "Update packages or schedulers once—clients always land on your latest info.",
        Icon: CalendarCheck,
        iconClass: "bg-emerald-500/15 text-emerald-400",
      },
      {
        title: "No app for your customer",
        body: "Their phone opens your page in the browser. Save contact and tap your buttons instantly.",
        Icon: Sparkles,
        iconClass: "bg-teal-500/15 text-teal-400",
      },
      {
        title: "Field-ready sharing",
        body: "QR on the van, NFC on your hand—whatever fits how you work that day.",
        Icon: QrCode,
        iconClass: "bg-cyan-500/15 text-cyan-400",
      },
    ],
  },
  "nfc-tap": {
    slug: "nfc-tap",
    title: "NFC Digital Business Card — Tap to Share Your RingTap Profile",
    description:
      "Link an NFC ring or card to your RingTap profile in the app. One tap opens ringtap.me/you—no third-party writer required. Shop rings or start free with QR.",
    keywords: [
      "NFC digital business card",
      "NFC ring business card",
      "tap to share contact",
      "digital business card iPhone",
      "NFC business card app",
    ],
    eyebrow: "Tap. Their phone opens. Done.",
    h1: "The tap that replaces “let me spell my link”",
    subhead:
      "Write your ringtap.me URL to an NFC ring or card from inside RingTap—then tap Android phones or newer iPhones. Prefer QR? It’s in the same app, same profile.",
    gradient:
      "linear-gradient(165deg, #0A0A0B 0%, #100d18 35%, #120f1e 60%, #0A0A0B 100%)",
    glowColor: "rgba(167, 139, 250, 0.14)",
    signupHref: "/signup?plan=free",
    benefits: [
      {
        title: "In-app NFC writer",
        body: "Pair your hardware without juggling shortcuts or extra utilities.",
        Icon: Zap,
        iconClass: "bg-violet-500/15 text-violet-400",
      },
      {
        title: "Premium hardware optional",
        body: "Start with QR and your link—add a ring from the RingTap store when you’re ready.",
        Icon: Star,
        iconClass: "bg-fuchsia-500/15 text-fuchsia-400",
      },
      {
        title: "Pro polish when you scale",
        body: "Custom QR, analytics, and lead capture when you want metrics behind the tap.",
        Icon: QrCode,
        iconClass: "bg-indigo-500/15 text-indigo-400",
      },
    ],
  },
  "free-digital-card": {
    slug: "free-digital-card",
    title: "Free Digital Business Card App — RingTap | NFC, QR & Link",
    description:
      "Create a free digital business card with ringtap.me/yourname. Share with QR code or personal link; add NFC later. Works on iPhone and Android for recipients.",
    keywords: [
      "free digital business card",
      "free digital business card app",
      "QR code business card free",
      "online business card",
      "ringtap.me",
    ],
    eyebrow: "Free to start · No credit card",
    h1: "Your professional link, live in minutes",
    subhead:
      "Pick a username, add your booking and social buttons, and share one URL everywhere—in your bio, on invoices, and after meetings. Upgrade only when you need Pro tools.",
    gradient:
      "linear-gradient(165deg, #0A0A0B 0%, #14100c 30%, #160f0a 55%, #0A0A0B 100%)",
    glowColor: "rgba(251, 191, 36, 0.1)",
    signupHref: "/signup?plan=free",
    benefits: [
      {
        title: "$0 forever tier",
        body: "Core profile, QR, and NFC sharing on the free plan—grow first, pay later.",
        Icon: Star,
        iconClass: "bg-amber-500/15 text-amber-400",
      },
      {
        title: "One link, always yours",
        body: "ringtap.me/you stays constant while your offers and links evolve.",
        Icon: Sparkles,
        iconClass: "bg-orange-500/15 text-orange-400",
      },
      {
        title: "Download and go",
        body: "Create your page in the app, then share from web or phone—recipients never install RingTap.",
        Icon: CalendarCheck,
        iconClass: "bg-yellow-500/15 text-yellow-400",
      },
    ],
  },
};

export function isAdLandingSlug(s: string): s is AdLandingSlug {
  return (AD_LANDING_SLUGS as readonly string[]).includes(s);
}

export function adLandingCanonical(slug: AdLandingSlug): string {
  return `${SITE_URL}/landing/${slug}`;
}
