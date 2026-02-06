import type { Metadata } from "next";
import { StoreCartProvider } from "@/contexts/StoreCartContext";

const SITE_URL = "https://www.ringtap.me";

export const metadata: Metadata = {
  title: "NFC Rings & Store — RingTap",
  description:
    "Shop NFC rings for RingTap. Tap to share your digital business card instantly. Stainless steel, waterproof, US sizes 5–13. Free shipping.",
  keywords: ["NFC ring", "RingTap ring", "digital business card ring", "NFC jewelry", "contact sharing ring"],
  openGraph: {
    title: "NFC Rings for RingTap — Shop Now",
    description: "Tap your ring to share your profile. NFC rings in multiple styles and sizes.",
    url: `${SITE_URL}/store`,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NFC Rings for RingTap — Shop Now",
    description: "Tap your ring to share your profile. NFC rings in multiple styles and sizes.",
  },
  alternates: { canonical: `${SITE_URL}/store` },
};

const storeJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "RingTap NFC Rings Store",
  url: `${SITE_URL}/store`,
  description: "Shop NFC rings that work with RingTap. Tap to share your digital business card.",
  mainEntity: {
    "@type": "ItemList",
    itemListElement: [
      { "@type": "Product", name: "Classic NFC Ring", offers: { "@type": "Offer", price: "49", priceCurrency: "USD" } },
      { "@type": "Product", name: "Carbon NFC Ring", offers: { "@type": "Offer", price: "59", priceCurrency: "USD" } },
      { "@type": "Product", name: "Silver Band NFC Ring", offers: { "@type": "Offer", price: "54", priceCurrency: "USD" } },
    ],
  },
};

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StoreCartProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }}
      />
      {children}
    </StoreCartProvider>
  );
}
