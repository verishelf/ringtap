/**
 * In-App Purchase (IAP) integration for Pro subscription.
 *
 * Uses expo-in-app-purchases. Product IDs must match App Store Connect.
 * IAP requires a development build (npx expo run:ios) — it does NOT work in Expo Go.
 * When the native module is unavailable, all IAP functions no-op gracefully.
 */

import { Platform } from 'react-native';

const RING_API_BASE = 'https://www.ringtap.me';

/** Lazy-load expo-in-app-purchases (crashes in Expo Go if imported at top level) */
function getIAP() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-in-app-purchases');
  } catch {
    return null;
  }
}

/** Product IDs - must match App Store Connect (monthly $14.99, yearly $119.99) */
export const IAP_PRODUCT_IDS = Platform.select({
  ios: ['006', '007'],
  android: ['006', '007'],
  default: [] as string[],
});

export type IAPProduct = {
  productId: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  type: number;
  subscriptionPeriod?: string;
};

export type IAPState = 'idle' | 'connecting' | 'loading' | 'purchasing' | 'restoring' | 'error';

let isConnected = false;
let purchaseResolver: ((success: boolean) => void) | null = null;

/**
 * Connect to the store. Call once when the purchase screen mounts.
 */
export async function iapConnect(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (IAP_PRODUCT_IDS.length === 0) return false;
  if (isConnected) return true;

  const iap = getIAP();
  if (!iap) return false;

  try {
    await iap.connectAsync();
    isConnected = true;
    return true;
  } catch {
    return false;
  }
}

/**
 * Disconnect when done. Call when leaving the purchase screen.
 */
export async function iapDisconnect(): Promise<void> {
  if (!isConnected) return;
  const iap = getIAP();
  if (!iap) {
    isConnected = false;
    return;
  }
  try {
    await iap.disconnectAsync();
  } finally {
    isConnected = false;
  }
}

/**
 * Set the purchase listener. Must be called before purchaseItemAsync.
 * Handles purchase completion, validates receipt with backend, and finishes the transaction.
 *
 * @param getAuth Async getter for { accessToken, userId } - used to validate receipt server-side
 * @param onPurchaseComplete Called with success after validation (or immediately on cancel/error)
 */
export function iapSetPurchaseListener(
  getAuth: () => Promise<{ accessToken: string; userId: string } | null>,
  onPurchaseComplete: (success: boolean) => void
): () => void {
  const iap = getIAP();
  if (!iap) return () => {};

  const IAPResponseCode = iap.IAPResponseCode ?? { OK: 0, USER_CANCELED: 1 };
  const callback = async (result: {
    responseCode: number;
    results?: Array<{
      productId: string;
      acknowledged: boolean;
      transactionReceipt?: string;
    }>;
  }) => {
    if (result.responseCode === IAPResponseCode.OK && result.results?.length) {
      const purchases = result.results;
      let validated = false;
      for (const p of purchases) {
        if (!p.acknowledged && p.transactionReceipt) {
          const auth = await getAuth();
          if (auth) {
            validated = await validateIAPReceipt(
              auth.accessToken,
              auth.userId,
              p.transactionReceipt
            );
          }
        }
        try {
          await iap.finishTransactionAsync(p as never, false);
        } catch {
          // ignore
        }
      }
      onPurchaseComplete(validated);
      if (purchaseResolver) {
        purchaseResolver(validated);
        purchaseResolver = null;
      }
    } else if (result.responseCode === IAPResponseCode.USER_CANCELED) {
      onPurchaseComplete(false);
      if (purchaseResolver) {
        purchaseResolver(false);
        purchaseResolver = null;
      }
    } else {
      onPurchaseComplete(false);
      if (purchaseResolver) {
        purchaseResolver(false);
        purchaseResolver = null;
      }
    }
  };

  iap.setPurchaseListener(callback as never);
  return () => {
    // expo-in-app-purchases does not provide removeListener; keep callback
  };
}

/**
 * Fetch product details from the store.
 */
export async function iapGetProducts(): Promise<IAPProduct[]> {
  if (Platform.OS === 'web' || IAP_PRODUCT_IDS.length === 0) return [];
  if (!isConnected) return [];

  const iap = getIAP();
  if (!iap) return [];

  try {
    const { responseCode, results } = await iap.getProductsAsync(IAP_PRODUCT_IDS);
    if (responseCode === (iap.IAPResponseCode?.OK ?? 0) && results?.length) {
      return results;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Start purchase flow for a product. Result comes via purchase listener.
 */
export async function iapPurchase(productId: string): Promise<boolean> {
  if (Platform.OS === 'web' || !isConnected) return false;

  const iap = getIAP();
  if (!iap) return false;

  return new Promise((resolve) => {
    purchaseResolver = resolve;
    iap.purchaseItemAsync(productId).catch(() => {
      if (purchaseResolver) {
        purchaseResolver(false);
        purchaseResolver = null;
      }
    });
  });
}

/**
 * Restore purchases. On success, backend will be updated when we validate.
 */
export async function iapRestore(
  accessToken: string,
  userId: string
): Promise<{ restored: boolean; error?: string }> {
  if (Platform.OS === 'web' || !isConnected) {
    return { restored: false, error: 'IAP not available' };
  }

  const iap = getIAP();
  if (!iap) return { restored: false, error: 'IAP not available' };

  try {
    const { responseCode, results } = await iap.getPurchaseHistoryAsync();
    if (responseCode !== (iap.IAPResponseCode?.OK ?? 0) || !results?.length) {
      return { restored: false, error: 'No purchases to restore' };
    }

    // Find Pro subscription receipts to validate
    const proPurchases = results.filter((p) =>
      IAP_PRODUCT_IDS.includes(p.productId)
    );
    if (proPurchases.length === 0) {
      return { restored: false, error: 'No Pro subscription found' };
    }

    // Use the most recent Pro purchase receipt for validation
    const latest = proPurchases.sort(
      (a, b) => (b.purchaseTime ?? 0) - (a.purchaseTime ?? 0)
    )[0];
    const receipt = (latest as { transactionReceipt?: string }).transactionReceipt;
    if (!receipt) {
      return { restored: false, error: 'Receipt not available' };
    }

    const ok = await validateIAPReceipt(accessToken, userId, receipt);
    return ok ? { restored: true } : { restored: false, error: 'Validation failed' };
  } catch (e) {
    return {
      restored: false,
      error: e instanceof Error ? e.message : 'Restore failed',
    };
  }
}

/**
 * Send receipt to backend for validation and subscription upsert.
 */
export async function validateIAPReceipt(
  accessToken: string,
  userId: string,
  receiptBase64: string
): Promise<boolean> {
  try {
    const res = await fetch(`${RING_API_BASE}/api/iap/validate-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ userId, receipt: receiptBase64 }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    return res.ok && !!data.ok;
  } catch {
    return false;
  }
}
