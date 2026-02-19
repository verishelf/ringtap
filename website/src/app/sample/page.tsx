import { Header } from "@/components/Header";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sample Profile — RingTap",
  description:
    "See what a RingTap profile looks like when someone taps your NFC ring or scans your QR code.",
};

const SAMPLE_PROFILE = {
  name: "Alex Chen",
  title: "Product Designer",
  bio: "Creating digital experiences that connect people. Love NFC, QR, and making networking effortless.",
  links: [
    { type: "linkedin", label: "LinkedIn" },
    { type: "instagram", label: "Instagram" },
    { type: "other", label: "Portfolio" },
  ],
};

export default function SampleProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header variant="home" />

      <main className="pt-24 pb-20 px-6">
        <div className="mx-auto max-w-lg">
          <Link
            href="/#sample-profile"
            className="inline-flex items-center gap-2 text-sm text-muted-light hover:text-foreground transition-colors mb-8"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>

          <p className="text-sm text-muted-light mb-6">
            This is a sample RingTap profile — what others see when they tap your NFC ring or scan your QR code.
          </p>

          {/* Profile card — matches app/web profile layout */}
          <div className="rounded-2xl border-2 border-[#D4AF37] bg-surface overflow-hidden">
            <div className="pt-8 pb-4 px-6 text-center">
              <div className="mx-auto mb-4 flex h-[94px] w-[94px] items-center justify-center rounded-full bg-surface-elevated border-[3px] border-[#D4AF37] text-3xl font-bold text-accent">
                {SAMPLE_PROFILE.name.charAt(0)}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center justify-center gap-2 flex-wrap">
                {SAMPLE_PROFILE.name}
                <span className="inline-flex h-[20px] w-[20px] items-center justify-center rounded-full bg-accent text-background" title="Pro">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </h1>
              <p className="text-muted-light mt-1">{SAMPLE_PROFILE.title}</p>
              <p className="text-muted-light text-sm mt-2">{SAMPLE_PROFILE.bio}</p>
              <p className="text-muted text-xs mt-2">ringtap.me/sample</p>
            </div>
            <div className="border-t border-border-light px-6 py-4 space-y-2">
              {SAMPLE_PROFILE.links.map((link) => (
                <div
                  key={link.type}
                  className="flex items-center justify-between rounded-xl border border-border-light bg-surface-elevated px-4 py-3 text-sm font-medium text-foreground"
                >
                  {link.label}
                  <svg className="w-4 h-4 text-muted-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:bg-muted-light transition-colors"
            >
              Create your own profile
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
