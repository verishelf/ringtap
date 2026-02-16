import { Header } from "@/components/Header";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sample Profile — RingTap",
  description: "See what a RingTap profile looks like when someone taps your NFC ring or scans your QR code.",
};

const SAMPLE = {
  name: "Alex Chen",
  title: "Product Designer",
  bio: "Creating digital experiences that connect people. Love NFC, QR, and making networking effortless. Tap my ring or scan my QR to get my full profile.",
  username: "demo",
  links: [
    { label: "LinkedIn", url: "#" },
    { label: "Instagram", url: "#" },
    { label: "Portfolio", url: "#" },
  ],
};

export default function DemoProfilePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header variant="home" />
      <div className="pt-24 pb-16 px-4 sm:px-6">
        <div className="max-w-lg mx-auto">
          <p className="text-center text-sm text-muted-light mb-6">
            Sample profile — this is what people see when they tap your ring or scan your QR
          </p>
          <div className="rounded-2xl border border-border-light bg-surface overflow-hidden">
            <div className="pt-8 pb-4 px-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-surface-elevated border-2 border-accent text-2xl font-bold text-accent">
                {SAMPLE.name.charAt(0)}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                {SAMPLE.name}
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent text-background" title="Pro">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </h1>
              <p className="text-muted-light mt-1">{SAMPLE.title}</p>
              <p className="text-muted-light text-sm mt-2 max-w-md mx-auto">{SAMPLE.bio}</p>
              <p className="text-muted text-xs mt-2">ringtap.me/{SAMPLE.username}</p>
            </div>
            <div className="border-t border-border-light px-6 py-4 space-y-2">
              {SAMPLE.links.map((link) => (
                <div
                  key={link.label}
                  className="flex items-center justify-between rounded-xl border border-border-light bg-surface-elevated px-4 py-3.5 text-sm font-semibold text-foreground"
                >
                  {link.label}
                  <svg className="w-4 h-4 text-muted-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ))}
            </div>
            <div className="border-t border-border-light px-6 py-4">
              <div className="rounded-xl bg-accent px-4 py-3.5 text-center font-semibold text-sm text-background">
                Save contact
              </div>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/#download"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:bg-muted-light transition-colors"
            >
              Create your own profile
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
