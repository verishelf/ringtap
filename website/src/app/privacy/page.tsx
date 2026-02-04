import { Header } from "@/components/Header";
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://www.ringtap.me";

export const metadata: Metadata = {
  title: "Privacy Policy — RingTap",
  description:
    "RingTap privacy policy: how we collect, use, and protect your data when you use the RingTap app and website.",
  openGraph: {
    title: "Privacy Policy — RingTap",
    description: "How RingTap collects, uses, and protects your data.",
    url: `${SITE_URL}/privacy`,
    type: "website",
  },
  twitter: { card: "summary", title: "Privacy Policy — RingTap", description: "How RingTap collects, uses, and protects your data." },
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-2 text-muted-light">
            Last updated: January 30, 2025
          </p>

          <div className="mt-12 space-y-10 text-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                1. Introduction
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                RingTap (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) provides a digital business card platform
                that lets you share your profile via NFC, QR codes, and a personal link (e.g. ringtap.me/username).
                This Privacy Policy explains how we collect, use, store, and protect your information when you use
                the RingTap mobile app, our website at ringtap.me (and related domains), and any related services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                2. Information we collect
              </h2>
              <ul className="mt-4 list-disc list-inside space-y-2 text-muted-light leading-relaxed">
                <li>
                  <strong className="text-foreground">Account data:</strong> Email address, password (hashed), and
                  any profile identifier (e.g. username) you choose when you sign up.
                </li>
                <li>
                  <strong className="text-foreground">Profile data:</strong> Name, title, company, bio, profile
                  photo, video intro, and contact details you add to your RingTap profile.
                </li>
                <li>
                  <strong className="text-foreground">Links and content:</strong> Social links, websites, custom
                  buttons, and payment links you add in the app.
                </li>
                <li>
                  <strong className="text-foreground">Scanned contacts:</strong> If you save contact information
                  from other users&apos; profiles (e.g. name, title, company, email), we store that data in your
                  account so you can access it in the app.
                </li>
                <li>
                  <strong className="text-foreground">Usage and device data:</strong> We may collect analytics
                  (e.g. how often your profile is viewed or shared) and, where applicable, device type and app
                  version to improve the service.
                </li>
                <li>
                  <strong className="text-foreground">Payment data:</strong> If you subscribe to RingTap Pro,
                  payment is processed by Stripe. We do not store your full card number; we may store
                  billing-related identifiers (e.g. subscription status) provided by Stripe.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                3. How we use your information
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                We use the information we collect to: provide and operate the RingTap service; display your
                profile to people who scan your NFC/QR or visit your link; manage your account and subscription;
                improve the app and website; send you important service or security notices; and comply with
                applicable law. We do not sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                4. Data storage and third parties
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                Your data is stored and processed using Supabase and related infrastructure. Payment processing
                is handled by Stripe. The RingTap app may be distributed through the Apple App Store and Google
                Play; their respective privacy policies apply to your use of those stores and, where relevant,
                in-app purchases. We may use other service providers for hosting, analytics, or support; they
                are bound by agreements that limit their use of your data to providing the service to us.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                5. Your profile and public information
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                The profile and link content you publish (name, photo, title, links, etc.) are intended to be
                shared with anyone who scans your NFC/QR or opens your ringtap.me link. By publishing that
                information, you consent to it being visible to those users. Do not add sensitive personal
                data to your public profile if you do not want it shared.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                6. Cookies and website tracking
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                Our website may use cookies or similar technologies for essential operation, security, and
                analytics. You can control cookies through your browser settings. The RingTap mobile app may
                use local storage (e.g. for preferences and session data) as described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                7. Your rights
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                Depending on where you live, you may have the right to access, correct, delete, or export your
                personal data, or to object to or restrict certain processing. You can update or delete much of
                your profile and account data directly in the RingTap app. For other requests (e.g. full
                account deletion or data export), contact us using the details below. We will respond in
                accordance with applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                8. Security and retention
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                We use industry-standard measures to protect your data (e.g. encryption, access controls).
                We retain your information for as long as your account is active or as needed to provide the
                service and comply with legal obligations. After account deletion, we remove or anonymize your
                data within a reasonable period, except where we must retain it for legal or safety reasons.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                9. Children
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                RingTap is not directed at children under 13 (or equivalent minimum age in your country). We
                do not knowingly collect personal information from children. If you believe a child has
                provided us with personal information, please contact us and we will delete it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                10. Changes to this policy
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                We may update this Privacy Policy from time to time. We will post the revised policy on this
                page and update the &quot;Last updated&quot; date. For material changes, we may notify you via the app
                or your email. Continued use of RingTap after changes constitutes acceptance of the updated
                policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                11. Contact
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                For privacy-related questions, requests, or complaints, contact us at:
              </p>
              <p className="mt-2 text-foreground">
                RingTap — Privacy
                <br />
                Email:{" "}
                <a
                  href="mailto:privacy@ringtap.me"
                  className="text-accent hover:underline"
                >
                  privacy@ringtap.me
                </a>
              </p>
              <p className="mt-4 text-muted-light leading-relaxed">
                You may also have the right to lodge a complaint with a supervisory authority in your
                country.
              </p>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-border-light/50">
            <Link
              href="/"
              className="text-sm text-accent hover:underline"
            >
              ← Back to RingTap
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
