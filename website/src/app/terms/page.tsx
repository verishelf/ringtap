import { Header } from "@/components/Header";
import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://www.ringtap.me";

export const metadata: Metadata = {
  title: "Terms of Use — RingTap",
  description:
    "RingTap Terms of Use: rules for using the RingTap app, website, and NFC/QR products.",
  openGraph: {
    title: "Terms of Use — RingTap",
    description: "Rules and conditions for using RingTap.",
    url: `${SITE_URL}/terms`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Terms of Use — RingTap",
    description: "Rules and conditions for using RingTap.",
  },
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
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
            Terms of Use
          </h1>
          <p className="mt-2 text-muted-light">
            Last updated: January 30, 2025
          </p>

          <div className="mt-12 space-y-10 text-foreground">
            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                1. Agreement to these Terms
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                By downloading or using the RingTap mobile app, visiting ringtap.me or related domains,
                purchasing NFC products, or otherwise accessing our services (collectively, the
                &quot;Service&quot;), you agree to be bound by these Terms of Use (the &quot;Terms&quot;).
                If you do not agree, do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                2. Eligibility and Accounts
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                You must be at least 13 years old (or the minimum age in your country) to use RingTap.
                You are responsible for maintaining the security of your account and for all activity
                that occurs under it. You agree to provide accurate information and to keep it up to date.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                3. Profiles, Content, and Links
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                RingTap lets you create a profile and share information, including your name, photo,
                links, contact info, and payment links. You are solely responsible for the content you
                add to your profile and for any links you share. Do not add content that is illegal,
                infringing, misleading, hateful, harassing, or that violates the rights of others.
              </p>
              <p className="mt-4 text-muted-light leading-relaxed">
                Profiles and links you choose to publish on ringtap.me are generally accessible to anyone
                with the link, NFC tap, or QR code. Do not publish sensitive personal information you do
                not want to share publicly.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                4. Payments and Subscriptions
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                Pro subscriptions and store purchases (e.g. NFC rings or cards) are processed by Stripe
                or other payment providers. Prices, billing frequency, and features are shown in the app
                or on the website at the time of purchase. Unless stated otherwise, subscriptions renew
                automatically until you cancel, which you can do via the app or billing portal.
              </p>
              <p className="mt-4 text-muted-light leading-relaxed">
                We may change subscription prices in the future; if we do, we will provide notice as
                required by law. All fees are non-refundable except where required by law or as we
                expressly state otherwise.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                5. Acceptable Use
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                You agree not to misuse RingTap. This includes, without limitation: attempting to access
                accounts without permission; trying to interfere with or disrupt the Service; scraping or
                harvesting data without consent; sending spam or unwanted communications; or using RingTap
                for unlawful, fraudulent, or harmful purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                6. Third‑Party Services and Links
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                The Service may include links to third-party websites, apps, payment providers (e.g.
                Cash App, Venmo, PayPal, Zelle), or other services. We do not control and are not
                responsible for those third parties. Your use of third-party services is governed by
                their own terms and policies, not these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                7. Intellectual Property
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                RingTap and its logos, branding, software, and content (excluding your user content) are
                owned by us or our licensors and protected by intellectual property laws. We grant you a
                limited, non-exclusive, non-transferable license to use the app and website solely for
                your personal or internal business use, subject to these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                8. Termination
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                We may suspend or terminate your access to the Service at any time if we believe you have
                violated these Terms, misused the Service, or created risk or legal exposure for us or
                others. You may stop using RingTap at any time. Some provisions of these Terms will
                continue to apply after termination (for example, limitations of liability).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                9. Disclaimers and Limitation of Liability
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
                whether express or implied. To the fullest extent permitted by law, we disclaim all
                warranties, including implied warranties of merchantability, fitness for a particular
                purpose, and non-infringement. We do not guarantee that the Service will be uninterrupted,
                secure, or error-free.
              </p>
              <p className="mt-4 text-muted-light leading-relaxed">
                To the maximum extent permitted by law, RingTap and its owners, employees, and partners
                will not be liable for any indirect, incidental, special, consequential, or punitive
                damages, or for any loss of profits or data, arising out of or in connection with your
                use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                10. Changes to these Terms
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                We may update these Terms from time to time. When we do, we will post the updated version
                on this page and update the &quot;Last updated&quot; date above. For material changes, we may notify
                you via the app, website, or email. Your continued use of the Service after changes become
                effective means you accept the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground border-b border-border-light/50 pb-2">
                11. Contact
              </h2>
              <p className="mt-4 text-muted-light leading-relaxed">
                If you have questions about these Terms, contact us at:
              </p>
              <p className="mt-2 text-foreground">
                RingTap — Terms
                <br />
                Email:{" "}
                <a
                  href="mailto:hello@ringtap.me"
                  className="text-accent hover:underline"
                >
                  hello@ringtap.me
                </a>
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

