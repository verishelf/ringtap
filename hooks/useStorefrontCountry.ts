/**
 * useStorefrontCountry - Detects if the user's App Store storefront is US.
 *
 * Per Apple Guideline 3.1.1(a), in the US App Store, apps may optionally show
 * links to external payment (e.g. web checkout). For all other storefronts,
 * IAP must be the only purchase option and external links must be hidden.
 *
 * Detection strategy:
 * - iOS: Use expo-localization regionCode as a proxy for storefront. Apple's
 *   SKPaymentQueue.storefront.countryCode would be more accurate but requires
 *   a native module. regionCode (device locale) is a reasonable approximation.
 * - Android / Web: Apple's 3.1.1 applies only to iOS. We still apply the same
 *   logic for consistency; regionCode works cross-platform.
 *
 * Conservative default: If detection fails, assume non-US (restrictive).
 * This ensures we never show external links where Apple forbids them.
 */

import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useLocales } from 'expo-localization';

/** US region codes (ISO 3166-1) - both 2-letter and 3-letter forms */
const US_CODES = new Set(['US', 'USA']);

export type StorefrontResult = {
  /** True if the storefront is US (or best-effort detection says US) */
  isUSStorefront: boolean;
  /** Detected region code (e.g. "US", "GB") or null if unknown */
  storefrontCountry: string | null;
  /** Whether detection is still loading (not used with sync detection; kept for future async) */
  loading: false;
};

/**
 * Returns whether the App Store storefront appears to be US.
 * - On iOS: Uses device locale regionCode as proxy. Default to false on failure.
 * - On Android/Web: Same logic; guideline 3.1.1 is iOS-specific but we keep behavior consistent.
 */
export function useStorefrontCountry(): StorefrontResult {
  const locales = useLocales();
  return useMemo(() => {
    // On web, we typically allow both flows (users may be from anywhere).
    if (Platform.OS === 'web') {
      return { isUSStorefront: true, storefrontCountry: null, loading: false };
    }

    try {
      const region = locales?.[0]?.regionCode?.toUpperCase?.();
      if (!region) {
        return { isUSStorefront: false, storefrontCountry: null, loading: false };
      }
      const isUS = US_CODES.has(region);
      return {
        isUSStorefront: isUS,
        storefrontCountry: region,
        loading: false,
      };
    } catch {
      return { isUSStorefront: false, storefrontCountry: null, loading: false };
    }
  }, [locales]);
}
