import type { Metadata } from "next";
import { StoreCartProvider } from "@/contexts/StoreCartContext";
import { PRODUCTS } from "@/data/products";

const SITE_URL = "https://www.ringtap.me";

export const metadata: Metadata = {
  title: "NFC Rings & Store — RingTap",
  description:
    "Shop NFC rings and cards for RingTap. Tap to share your digital business card instantly. Stainless steel, waterproof, US sizes 5–13. Free shipping on orders $50+. Secure checkout.",
  keywords: [
    "NFC ring",
    "NFC ring for business card",
    "RingTap ring",
    "digital business card ring",
    "NFC jewelry",
    "contact sharing ring",
    "NFC metal card",
    "smart business card",
  ],
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
  name: "RingTap NFC Rings & Cards Store",
  url: `${SITE_URL}/store`,
  description: "Shop NFC rings and cards that work with RingTap. Tap to share your digital business card.",
  mainEntity: {
    "@type": "ItemList",
    itemListElement: PRODUCTS.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: p.name,
        description: p.description,
        offers: { "@type": "Offer", price: String(p.price), priceCurrency: "USD" },
      },
    })),
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
