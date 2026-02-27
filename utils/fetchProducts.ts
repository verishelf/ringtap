/**
 * Fetches IAP products for the upgrade screen.
 * Uses lib/iap which lazy-loads expo-in-app-purchases.
 */
import { Platform } from 'react-native';

import { iapConnect, iapGetProducts, type IAPProduct } from '@/lib/iap';

export type { IAPProduct };

export type FetchProductsResult =
  | { products: IAPProduct[]; status: 'ok' }
  | { products: []; status: 'error'; error?: string };

const CONNECT_TIMEOUT_MS = 10000;

export async function fetchProducts(): Promise<FetchProductsResult> {
  if (Platform.OS === 'web') return { products: [], status: 'ok' };

  try {
    const connected = await Promise.race([
      iapConnect(),
      new Promise<false>((_, reject) =>
        setTimeout(() => reject(new Error('IAP connect timeout')), CONNECT_TIMEOUT_MS)
      ),
    ]);
    if (!connected) return { products: [], status: 'error', error: 'Could not connect to store' };

    const products = await iapGetProducts();
    return { products, status: 'ok' };
  } catch (e) {
    return {
      products: [],
      status: 'error',
      error: e instanceof Error ? e.message : 'Failed to load products',
    };
  }
}
