import { Header } from "@/components/Header";
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://www.ringtap.me";

export const metadata: Metadata = {
  title: "NFC Demo — RingTap",
  description:
    "RingTap NFC demo video for App Store review. Shows app and NFC ring pairing, writing profile to ring, and tapping to open profile.",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "RingTap NFC Demo — App Store Review",
    description: "Demo video: app and NFC ring pairing, write profile to ring, tap to open.",
    url: `${SITE_URL}/demo`,
    type: "website",
  },
};

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header variant="home" />

      <main className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-light hover:text-foreground transition-colors mb-8"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>

          <h1 className="text-3xl font-bold text-foreground md:text-4xl">
            RingTap NFC Demo
          </h1>
          <p className="mt-2 text-muted-light">
            App Store Review — Guideline 2.1
          </p>

          <p className="mt-6 text-muted-light leading-relaxed">
            This video demonstrates NFC functionality on a physical Apple device: pairing the app with the NFC ring,
            writing the profile URL to the ring, and tapping the ring to open the profile.
          </p>

          <div className="mt-10 rounded-xl overflow-hidden bg-surface-elevated border border-border-light">
            <video
              className="w-full aspect-video"
              controls
              playsInline
              preload="metadata"
            >
              <source src="/demo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>

          <p className="mt-6 text-sm text-muted-light">
            Add <code className="px-1.5 py-0.5 rounded bg-surface-elevated text-foreground">demo.mp4</code> to{" "}
            <code className="px-1.5 py-0.5 rounded bg-surface-elevated text-foreground">website/public/</code> to display the video.
          </p>
        </div>
      </main>
    </div>
  );
}
