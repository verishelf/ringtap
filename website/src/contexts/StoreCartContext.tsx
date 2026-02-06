'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const CART_STORAGE_KEY = 'ringtap-store-cart';

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
};

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

type StoreCartContextValue = {
  items: CartItem[];
  count: number;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, quantity: number, size?: string) => void;
  clearCart: () => void;
};

const StoreCartContext = createContext<StoreCartContextValue | null>(null);

function lineKey(productId: string, size?: string) {
  return size ? `${productId}:${size}` : productId;
}

export function StoreCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveCart(items);
  }, [items, mounted]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const qty = item.quantity ?? 1;
    setItems((prev) => {
      const key = lineKey(item.productId, item.size);
      const existing = prev.find((i) => lineKey(i.productId, i.size) === key);
      if (existing) {
        return prev.map((i) =>
          lineKey(i.productId, i.size) === key ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [...prev, { ...item, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((productId: string, size?: string) => {
    const key = lineKey(productId, size);
    setItems((prev) => prev.filter((i) => lineKey(i.productId, i.size) !== key));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, size?: string) => {
    const key = lineKey(productId, size);
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => lineKey(i.productId, i.size) !== key));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (lineKey(i.productId, i.size) === key ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const count = items.reduce((n, i) => n + i.quantity, 0);

  return (
    <StoreCartContext.Provider
      value={{ items, count, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </StoreCartContext.Provider>
  );
}

export function useStoreCart() {
  const ctx = useContext(StoreCartContext);
  if (!ctx) throw new Error('useStoreCart must be used within StoreCartProvider');
  return ctx;
}
