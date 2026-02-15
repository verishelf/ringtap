import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-K8VP2WCYEC";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = "https://www.ringtap.me";
const SITE_NAME = "RingTap";
const DEFAULT_DESCRIPTION =
  "RingTap is your digital business card. Share your profile instantly with NFC rings, QR codes, or your personal link—ringtap.me/you. Free to start, works on iPhone and Android.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "RingTap — Your Digital Business Card | NFC & QR Sharing",
    template: "%s | RingTap",
  },
  description: DEFAULT_DESCRIPTION,
  keywords: [
    "digital business card",
    "NFC business card",
    "NFC ring",
    "QR code business card",
    "contact sharing",
    "ringtap",
    "ringtap.me",
    "networking",
    "digital profile",
    "share contact",
  ],
  authors: [{ name: "RingTap", url: SITE_URL }],
  creator: "RingTap",
  publisher: "RingTap",
  formatDetection: { email: false, telephone: false },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "RingTap — Your Digital Business Card. One Tap.",
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "RingTap - Digital business card, NFC and QR sharing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RingTap — Your Digital Business Card. One Tap.",
    description: DEFAULT_DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: SITE_URL },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  category: "technology",
};

const jsonLdWebsite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: DEFAULT_DESCRIPTION,
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/profile/{username}` },
    "query-input": "required name=username",
  },
};

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/og.png`,
  description: DEFAULT_DESCRIPTION,
};

const jsonLdProduct = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "RingTap",
  applicationCategory: "BusinessApplication",
  operatingSystem: "iOS, Android",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: "0",
    highPrice: "9",
    offerCount: "2",
  },
  description: DEFAULT_DESCRIPTION,
  url: SITE_URL,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Doto:wght@100..900&family=Orbitron:wght@400..900&family=Raleway+Dots&family=Zen+Dots&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdWebsite),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdOrganization),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLdProduct),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased bg-background text-foreground`}
      >
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
