"use client";

import { Header } from "@/components/Header";
import { useStoreCart } from "@/contexts/StoreCartContext";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function CartContent() {
  const { items, count, updateQuantity, removeItem, clearCart } = useStoreCart();
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "1";
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (success) clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    setError(null);
    setCheckingOut(true);
    try {
      const res = await fetch("/api/stripe/create-store-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            size: i.size,
          })),
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not start checkout");
        setCheckingOut(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("No checkout URL returned");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    }
    setCheckingOut(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header variant="store" cartCount={count} />

      <section className="border-b border-border-light/50 px-6 pt-24 pb-8">
        <div className="mx-auto max-w-2xl">
          {success && (
            <div className="mb-4 rounded-xl bg-accent/15 border border-accent/30 px-4 py-3 text-sm text-foreground">
              Thank you for your order. We’ll process it and send shipping details to your email.
            </div>
          )}
          <h1 className="text-2xl font-bold text-foreground">Your cart</h1>
          <p className="mt-1 text-sm text-muted-light">
            {count === 0 ? "Your cart is empty." : `${count} item${count !== 1 ? "s" : ""}`}
          </p>
        </div>
      </section>

      <section className="px-6 py-8">
        <div className="mx-auto max-w-2xl">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-border-light bg-surface p-8 text-center">
              <p className="text-muted-light">Add rings or cards from the store to checkout.</p>
              <Link
                href="/store"
                className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-background hover:opacity-90"
              >
                Continue shopping
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-4">
                {items.map((item) => (
                  <li
                    key={item.size ? `${item.productId}-${item.size}` : item.productId}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border-light bg-surface p-4"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{item.name}</p>
                      {item.size && (
                        <p className="text-sm text-muted-light">Size: US {item.size}</p>
                      )}
                      <p className="text-sm text-accent">${item.price} each</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-border-light bg-background">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1, item.size)
                          }
                          className="h-9 w-9 flex items-center justify-center text-foreground hover:bg-surface-elevated"
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="min-w-[2rem] text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1, item.size)
                          }
                          className="h-9 w-9 flex items-center justify-center text-foreground hover:bg-surface-elevated"
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.size)}
                        className="text-sm text-muted-light hover:text-destructive"
                      >
                        Remove
                      </button>
                    </div>
                    <p className="w-full text-right text-sm font-semibold text-foreground sm:w-auto">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-4">
                <div className="flex justify-between text-lg font-semibold text-foreground">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {error && (
                  <p className="rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    className="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-70"
                  >
                    {checkingOut ? "Redirecting…" : "Proceed to checkout"}
                  </button>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="rounded-xl border border-border-light px-4 py-3 text-sm font-medium text-muted-light hover:bg-surface-elevated"
                  >
                    Clear cart
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default function StoreCartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <Header variant="store" />
          <div className="px-6 pt-24 flex justify-center">
            <img
              src="/loading.gif"
              alt="Loading cart"
              className="w-16 h-16"
            />
          </div>
        </div>
      }
    >
      <CartContent />
    </Suspense>
  );
}
