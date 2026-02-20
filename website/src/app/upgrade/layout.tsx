import type { Metadata } from "next";

const SITE_URL = "https://www.ringtap.me";

export const metadata: Metadata = {
  title: "Upgrade to Pro — RingTap",
  description:
    "Upgrade to RingTap Pro for unlimited links, custom themes, analytics, and your theme on ringtap.me. $9/month or $99/year. Cancel anytime.",
  openGraph: {
    title: "Upgrade to Pro — RingTap",
    description: "Unlimited links, analytics, custom QR, and more. $9/month.",
    url: `${SITE_URL}/upgrade`,
    type: "website",
  },
  alternates: { canonical: `${SITE_URL}/upgrade` },
  robots: { index: true, follow: true },
};

export default function UpgradeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
