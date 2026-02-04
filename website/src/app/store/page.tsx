"use client";

import { Header } from "@/components/Header";
import Link from "next/link";
import { useState } from "react";

const RING_SIZES = [
  "5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "13",
];

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  type: "ring" | "card";
};

const PRODUCTS: Product[] = [
  {
    id: "classic",
    name: "Classic NFC Ring",
    description: "Sleek, minimal NFC ring. Tap to share your RingTap profile. Stainless steel, waterproof.",
    price: 49,
    image: "⌖",
    type: "ring",
  },
  {
    id: "carbon",
    name: "Carbon NFC Ring",
    description: "Lightweight matte black. NFC chip built in—tap any phone to open your profile.",
    price: 59,
    image: "◆",
    type: "ring",
  },
  {
    id: "silver",
    name: "Silver Band NFC Ring",
    description: "Polished silver band. Works with RingTap—one tap shares your ringtap.me link.",
    price: 54,
    image: "○",
    type: "ring",
  },
  {
    id: "metal-card",
    name: "Metal NFC Card",
    description: "Premium metal card with NFC. Wallet-friendly—tap to share your RingTap profile. Brushed finish.",
    price: 34,
    image: "▢",
    type: "card",
  },
  {
    id: "metal-card-black",
    name: "Black Metal NFC Card",
    description: "Matte black metal NFC card. Same tap-to-share as the ring—fits in your wallet.",
    price: 36,
    image: "▪",
    type: "card",
  },
  {
    id: "classic-card",
    name: "Classic NFC Card",
    description: "White plastic NFC card. Program with your ringtap.me link. Slim and durable.",
    price: 19,
    image: "□",
    type: "card",
  },
];

export default function StorePage() {
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [added, setAdded] = useState<Record<string, boolean>>({});

  const handleSizeChange = (ringId: string, size: string) => {
    setSelectedSizes((prev) => ({ ...prev, [ringId]: size }));
  };

  const handleAddToCart = (productId: string) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (product?.type === "ring") {
      const size = selectedSizes[productId];
      if (!size) {
        alert("Please select a ring size.");
        return;
      }
      setAdded((prev) => ({ ...prev, [productId]: true }));
      alert(`Added to cart: ${product.name}, size ${size}. Checkout coming soon—we'll notify you when ready.`);
    } else {
      setAdded((prev) => ({ ...prev, [productId]: true }));
      alert(`Added to cart: ${product?.name ?? productId}. Checkout coming soon—we'll notify you when ready.`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header variant="store" />

      {/* Store hero — centered with balanced padding */}
      <section className="border-b border-border-light/50 px-6 pt-20 pb-16 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-4xl flex flex-col items-center justify-center text-center min-h-[180px]">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            NFC rings & cards for RingTap
          </h1>
          <p className="mt-4 text-muted-light max-w-2xl">
            Tap your ring or card to someone's phone—your profile opens instantly. Rings: US sizes 5–13.
          </p>
        </div>
      </section>

      {/* Size guide */}
      <section className="border-b border-border-light/50 py-8 px-6">
        <div className="mx-auto max-w-6xl">
          <details className="group rounded-xl border border-border-light bg-surface p-4">
            <summary className="cursor-pointer list-none text-sm font-semibold text-foreground">
              How to find your ring size
            </summary>
            <div className="mt-4 space-y-2 text-sm text-muted-light">
              <p>
                <strong className="text-foreground">Measure at home:</strong> Wrap a strip of paper around the base of your finger, mark where it overlaps, then measure the length in mm. Use a ring size chart (e.g. 52mm ≈ US 6, 57mm ≈ US 9).
              </p>
              <p>
                <strong className="text-foreground">Jewelry store:</strong> Ask for a free ring sizing—they’ll tell you your US size.
              </p>
              <p>
                Sizes shown are US. If you’re between sizes, we recommend sizing up for a comfortable fit.
              </p>
            </div>
          </details>
        </div>
      </section>

      {/* Products */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((product) => (
              <article
                key={product.id}
                className="rounded-2xl border border-border-light bg-surface p-6 flex flex-col"
              >
                <div className="flex h-24 w-full items-center justify-center rounded-xl bg-surface-elevated text-4xl text-accent mb-4">
                  {product.image}
                </div>
                <h2 className="text-lg font-bold text-foreground">{product.name}</h2>
                <p className="mt-2 text-sm text-muted-light leading-relaxed flex-1">
                  {product.description}
                </p>
                <p className="mt-4 text-xl font-bold text-accent">${product.price}</p>

                {product.type === "ring" && (
                  <div className="mt-4">
                    <label htmlFor={`size-${product.id}`} className="block text-xs font-medium text-muted-light mb-2">
                      Ring size (US)
                    </label>
                    <select
                      id={`size-${product.id}`}
                      value={selectedSizes[product.id] ?? ""}
                      onChange={(e) => handleSizeChange(product.id, e.target.value)}
                      className="w-full rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="">Select size</option>
                      {RING_SIZES.map((size) => (
                        <option key={size} value={size}>
                          US {size}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleAddToCart(product.id)}
                  disabled={added[product.id]}
                  className="mt-6 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-background hover:bg-muted-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {added[product.id] ? "Added — checkout coming soon" : "Add to cart"}
                </button>
              </article>
            ))}
          </div>

          <p className="mt-10 text-center text-sm text-muted">
            Checkout and shipping coming soon. Add to cart to get notified when we launch.
          </p>
        </div>
      </section>

      {/* CTA back to app */}
      <section className="border-t border-border-light/50 py-16 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold text-foreground">Don’t have a ring yet?</h2>
          <p className="mt-2 text-muted-light">
            You can still use RingTap with your phone—share your profile via QR code or your ringtap.me link.
          </p>
          <Link
            href="/#download"
            className="mt-6 inline-flex rounded-xl border border-border-light px-6 py-3 text-sm font-semibold text-foreground hover:border-accent hover:bg-surface transition-colors"
          >
            Download the app
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-light/50 py-8 px-6">
        <div className="mx-auto max-w-6xl flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <Link href="/" className="text-sm font-bold text-foreground">
            RingTap
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/#features" className="text-sm text-muted-light hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="/store" className="text-sm text-muted-light hover:text-foreground transition-colors">
              Store
            </Link>
            <Link href="/#faq" className="text-sm text-muted-light hover:text-foreground transition-colors">
              FAQ
            </Link>
            <Link href="/privacy" className="text-sm text-muted-light hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link href="/#download" className="text-sm text-muted-light hover:text-foreground transition-colors">
              Download
            </Link>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-6xl text-center text-xs text-muted">
          Your digital business card. One tap. ringtap.me
        </p>
        <div className="mx-auto mt-4 max-w-6xl flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted">
          <Link href="/#faq" className="hover:text-foreground transition-colors">FAQ</Link>
          <span className="text-border-light">·</span>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
}
