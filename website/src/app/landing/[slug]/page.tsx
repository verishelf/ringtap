import { AdLandingTemplate } from "@/components/landing/AdLandingTemplate";
import {
  AD_LANDING_PAGES,
  AD_LANDING_SLUGS,
  type AdLandingSlug,
  adLandingCanonical,
  isAdLandingSlug,
} from "@/data/adLandingPages";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const SITE_URL = "https://www.ringtap.me";
const OG = `${SITE_URL}/og.png`;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return AD_LANDING_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isAdLandingSlug(slug)) return { title: "Landing | RingTap" };
  const cfg = AD_LANDING_PAGES[slug as AdLandingSlug];
  const canonical = adLandingCanonical(cfg.slug);
  return {
    title: cfg.title,
    description: cfg.description,
    keywords: cfg.keywords,
    openGraph: {
      title: cfg.title,
      description: cfg.description,
      url: canonical,
      type: "website",
      siteName: "RingTap",
      images: [{ url: OG, width: 1200, height: 630, alt: "RingTap — digital business card" }],
    },
    twitter: {
      card: "summary_large_image",
      title: cfg.title,
      description: cfg.description,
      images: [OG],
    },
    alternates: { canonical },
    robots: { index: true, follow: true },
  };
}

export default async function LandingVariantPage({ params }: Props) {
  const { slug } = await params;
  if (!isAdLandingSlug(slug)) notFound();
  const config = AD_LANDING_PAGES[slug];
  return <AdLandingTemplate config={config} />;
}
