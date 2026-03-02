/**
 * In-App Purchase (IAP) integration for Pro subscription.
 * Uses expo-in-app-purchases. Product IDs must match App Store Connect.
 * IAP works in store builds (TestFlight, App Store). Use isStoreBuild() to gate the UI.
 */
import { Platform } from 'react-native';

export const IAP_SUBSCRIPTION_GROUP_ID = '21929407';

/** Lazy-load expo-in-app-purchases (crashes in Expo Go if imported at top level) */
function getIAP() {
  try {
    return require('expo-in-app-purchases');
  } catch {
    return null;
  }
}

export const IAP_PRODUCT_IDS = Platform.select({
  ios: ['006', '007'],
  android: ['006', '007'],
  default: [] as string[],
});

/** Fallback prices when IAP unavailable (Expo Go, etc.) - must match App Store Connect */
export const IAP_FALLBACK_PRICES = {
  monthly: '$14.99',
  yearly: '$119.99',
};

export type IAPProduct = {
  productId: string;
  price: string;
  title?: string;
  description?: string;
};

export type IAPState = 'idle' | 'connecting' | 'loading' | 'purchasing' | 'restoring' | 'error';

const VALIDATE_URL = 'https://www.ringtap.me/api/iap/validate-receipt';

async function validateIAPReceipt(accessToken: string, userId: string, receipt: string): Promise<boolean> {
  const res = await fetch(VALIDATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ userId, receipt }),
  });
  const data = (await res.json()) as { ok?: boolean };
  return data.ok === true;
}

export async function iapConnect(): Promise<boolean> {
  if (IAP_PRODUCT_IDS.length === 0) return false;
  const iap = getIAP();
  if (!iap) return false;
  try {
    await Promise.race([
      iap.connectAsync(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('IAP connect timeout')), 10000)
      ),
    ]);
    return true;
  } catch {
    return false;
  }
}

export async function iapGetProducts(): Promise<IAPProduct[]> {
  if (Platform.OS === 'web' || IAP_PRODUCT_IDS.length === 0) return [];
  const iap = getIAP();
  if (!iap) return [];
  try {
    const { responseCode, results } = await iap.getProductsAsync(IAP_PRODUCT_IDS);
    const IAPResponseCode = iap.IAPResponseCode ?? { OK: 0 };
    if (responseCode === IAPResponseCode.OK && results?.length) {
      return results as IAPProduct[];
    }
  } catch {
    // ignore
  }
  return [];
}

export async function iapPurchase(
  productId: string,
  accessToken: string,
  userId: string
): Promise<{ purchased: boolean; error?: string }> {
  const iap = getIAP();
  if (!iap) return { purchased: false, error: 'IAP not available' };

  // Ensure connected before purchase (required for iPad/sandbox)
  const connected = await iapConnect();
  if (!connected) return { purchased: false, error: 'Could not connect to store. Please try again.' };

  const IAPResponseCode = iap.IAPResponseCode ?? { OK: 0, USER_CANCELED: 1, ERROR: 2, DEFERRED: 3 };

  let settled = false;
  const resolveOnce = (r: { purchased: boolean; error?: string }) => {
    if (settled) return;
    settled = true;
    resolve(r);
  };

  return new Promise<{ purchased: boolean; error?: string }>((resolve) => {
    iap.setPurchaseListener?.((result: { responseCode: number; results?: unknown[] }) => {
      if (result.responseCode === IAPResponseCode.DEFERRED) {
        resolveOnce({ purchased: false, error: 'Waiting for approval' });
        return;
      }
      if (result.responseCode === IAPResponseCode.OK && result.results?.length) {
        const purchase = result.results[0] as { transactionReceipt?: string; receipt?: string };
        const receipt = purchase.transactionReceipt ?? purchase.receipt ?? '';
        if (receipt) {
          validateIAPReceipt(accessToken, userId, receipt)
            .then((ok) => resolveOnce({ purchased: ok }))
            .catch(() => resolveOnce({ purchased: false, error: 'Validation failed' }));
        } else {
          resolveOnce({ purchased: true });
        }
        return;
      }
      if (result.responseCode === IAPResponseCode.USER_CANCELED) {
        resolveOnce({ purchased: false, error: 'Cancelled' });
        return;
      }
      resolveOnce({ purchased: false, error: 'Purchase failed' });
    });

    iap.purchaseItemAsync(productId).catch((e: unknown) => {
      resolveOnce({ purchased: false, error: e instanceof Error ? e.message : 'Purchase failed' });
    });
  });
}

export async function iapRestore(
  accessToken: string,
  userId: string
): Promise<{ restored: boolean; error?: string }> {
  const iap = getIAP();
  if (!iap) return { restored: false, error: 'IAP not available' };

  const connected = await iapConnect();
  if (!connected) return { restored: false, error: 'Could not connect to store. Please try again.' };

  try {
    const { responseCode, results } = await iap.getPurchaseHistoryAsync?.() ?? { responseCode: 1, results: [] };
    const IAPResponseCode = iap.IAPResponseCode ?? { OK: 0 };
    if (responseCode !== IAPResponseCode.OK || !results?.length) {
      return { restored: false, error: 'No purchases to restore' };
    }

    const proPurchase = (results as Array<{ productId?: string; transactionReceipt?: string; receipt?: string }>).find(
      (p) => IAP_PRODUCT_IDS.includes(p.productId ?? '')
    );
    if (!proPurchase) {
      return { restored: false, error: 'No Pro subscription found' };
    }

    const receipt = proPurchase.transactionReceipt ?? proPurchase.receipt ?? '';
    if (!receipt) return { restored: false, error: 'No receipt' };

    const ok = await validateIAPReceipt(accessToken, userId, receipt);
    return { restored: ok };
  } catch (e) {
    return { restored: false, error: e instanceof Error ? e.message : 'Restore failed' };
  }
}
