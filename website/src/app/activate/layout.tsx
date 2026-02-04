import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activate Ring",
  description: "Activating your RingTap NFC ring. Redirecting to the app.",
  robots: { index: false, follow: true },
};

export default function ActivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
