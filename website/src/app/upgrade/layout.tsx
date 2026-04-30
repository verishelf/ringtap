import type { Metadata } from "next";

const SITE_URL = "https://www.ringtap.me";

export const metadata: Metadata = {
  title: "Upgrade to Pro — RingTap",
  description:
    "RingTap Pro: unlimited links, full themes & video intro, analytics with lead captures, networking map, lead forms & webhooks (Zapier/Make), follow-ups & pipeline tags, HubSpot sync. $9/month or $99/year.",
  openGraph: {
    title: "Upgrade to Pro — RingTap",
    description:
      "Lead capture, webhooks, analytics, map, CRM sync, follow-ups — workflow after the tap. $9/month or $99/year.",
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
