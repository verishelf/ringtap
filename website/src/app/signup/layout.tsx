import type { Metadata } from "next";

const SITE_URL = "https://www.ringtap.me";

export const metadata: Metadata = {
  title: "Create Account — RingTap",
  description:
    "Create your free RingTap account. Get your digital business card and ringtap.me link in minutes. No credit card required. Start sharing with NFC, QR, or your link.",
  openGraph: {
    title: "Create Account — RingTap Digital Business Card",
    description: "Get your free digital business card. ringtap.me/you — share with NFC, QR, or link.",
    url: `${SITE_URL}/signup`,
    type: "website",
  },
  alternates: { canonical: `${SITE_URL}/signup` },
  robots: { index: true, follow: true },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
