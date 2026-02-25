import type { Metadata } from "next";

const SITE_URL = "https://www.ringtap.me";

export const metadata: Metadata = {
  title: "Affiliate Program",
  description:
    "Partner with RingTap. Share your referral link and earn when your audience signs up or upgrades to Pro. Get your unique link in minutes.",
  openGraph: {
    title: "RingTap Affiliate Program",
    description: "Share RingTap and earn. Get your referral link.",
    url: `${SITE_URL}/affiliates`,
    type: "website",
  },
  alternates: { canonical: `${SITE_URL}/affiliates` },
  robots: { index: true, follow: true },
};

export default function AffiliatesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
