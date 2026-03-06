/**
 * RevenueCat configuration for RingTap
 *
 * Dashboard setup:
 * - Create entitlement: RingTap Pro
 * - Add products: monthly, yearly, lifetime (match App Store Connect IDs)
 * - Create offering with these products
 * - Configure Paywall and Customer Center in dashboard
 *
 * Production: Set EXPO_PUBLIC_REVENUECAT_IOS_KEY and EXPO_PUBLIC_REVENUECAT_ANDROID_KEY
 * as EAS secrets. See docs/REVENUECAT_SETUP.md.
 */
import { Platform } from 'react-native';

/** RingTap Pro entitlement identifier - must match RevenueCat dashboard */
export const ENTITLEMENT_ID = 'RingTap Pro';

/**
 * Product identifiers - must match App Store Connect and RevenueCat dashboard.
 * Configure these in RevenueCat: Offerings > Products.
 */
export const PRODUCT_IDS = {
  monthly: 'monthly',
  yearly: 'yearly',
  lifetime: 'lifetime',
} as const;

/**
 * API keys:
 * - Production: From EAS secrets (EXPO_PUBLIC_REVENUECAT_IOS_KEY, EXPO_PUBLIC_REVENUECAT_ANDROID_KEY)
 * - Development: From .env, or test key fallback for local testing
 */
const REVENUECAT_TEST_KEY = 'test_wmxSTCgDoSUdvPwdlNBDUsyboHQ';

export function getRevenueCatApiKey(): string | null {
  if (Platform.OS === 'ios') {
    const key = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim();
    return key || (__DEV__ ? REVENUECAT_TEST_KEY : null);
  }
  if (Platform.OS === 'android') {
    const key = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY?.trim();
    return key || (__DEV__ ? REVENUECAT_TEST_KEY : null);
  }
  return null;
}
