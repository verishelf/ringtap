import { Platform } from 'react-native';

/** Product IDs - must match App Store Connect exactly */
const PRODUCT_IDS = ['006', '007'] as const;

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

export type FetchProductsResult =
  | { products: IAPProduct[]; status: 'ok' }
  | { products: []; status: 'missing_products' }
  | { products: []; status: 'unavailable' };

function getIAP() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-in-app-purchases');
  } catch {
    return null;
  }
}

/**
 * Fetches IAP products. Always calls getProductsAsync(["006", "007"]).
 * Returns { products: [], status: "missing_products" } when StoreKit returns no products
 * (e.g. subscriptions not yet attached to version in App Store Connect).
 * NEVER use products = [] to disable the UI — buttons should stay active in store builds.
 */
export async function fetchProducts(): Promise<FetchProductsResult> {
  if (Platform.OS === 'web') {
    return { products: [], status: 'unavailable' };
  }

  const iap = getIAP();
  if (!iap) {
    return { products: [], status: 'unavailable' };
  }

  try {
    await iap.connectAsync();
    const { responseCode, results } = await iap.getProductsAsync([...PRODUCT_IDS]);
    const IAPResponseCode = iap.IAPResponseCode ?? { OK: 0 };
    const products = (responseCode === IAPResponseCode.OK && results?.length
      ? results
      : []) as IAPProduct[];

    if (products.length === 0) {
      return { products: [], status: 'missing_products' };
    }
    return { products, status: 'ok' };
  } catch {
    return { products: [], status: 'unavailable' };
  }
}
