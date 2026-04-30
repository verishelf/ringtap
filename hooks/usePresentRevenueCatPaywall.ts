import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import RevenueCatUI from 'react-native-purchases-ui';

import { useRevenueCat } from '@/contexts/RevenueCatContext';
import { useSubscription } from '@/hooks/useSubscription';

/** Profile tab always exists (incl. iOS NativeTabs); settings is not a tab there—Expo Go/RC-off fallback must use this. */
const DEFAULT_UPGRADE_HREF = '/(tabs)/profile/upgrade' as Href;

export type PresentRevenueCatPaywallOptions = {
  /**
   * When RevenueCat isn’t available (Expo Go, etc.), use `replace` instead of `push` so
   * callers that navigate “after” the paywall don’t immediately wipe this screen (e.g. onboarding upsell).
   */
  fallbackReplace?: boolean;
};

/**
 * Presents the RevenueCat Paywall when the SDK is available (development/TestFlight builds).
 * In Expo Go or when init fails, `isAvailable` is false: we navigate to the upgrade screen instead.
 * Real IAP + RevenueCat Paywall need a dev client or EAS build, not Expo Go.
 *
 * @returns `true` if the native paywall modal ran (and finished); `false` if we only opened the fallback route.
 */
export function usePresentRevenueCatPaywall(
  fallbackHref: Href = DEFAULT_UPGRADE_HREF,
  hookOptions: PresentRevenueCatPaywallOptions = {}
) {
  const router = useRouter();
  const { offering, isAvailable: isRevenueCatAvailable } = useRevenueCat();
  const { refresh } = useSubscription();
  const [presentingPaywall, setPresentingPaywall] = useState(false);
  const { fallbackReplace = false } = hookOptions;

  const presentPaywall = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web' || !isRevenueCatAvailable) {
      if (fallbackReplace) router.replace(fallbackHref);
      else router.push(fallbackHref);
      return false;
    }
    setPresentingPaywall(true);
    try {
      const result = await RevenueCatUI.presentPaywall({
        offering: offering ?? undefined,
        displayCloseButton: true,
      });
      if (result === RevenueCatUI.PAYWALL_RESULT.PURCHASED || result === RevenueCatUI.PAYWALL_RESULT.RESTORED) {
        await refresh();
      }
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not open paywall';
      Alert.alert('Paywall error', msg);
      return true;
    } finally {
      setPresentingPaywall(false);
    }
  }, [fallbackHref, fallbackReplace, isRevenueCatAvailable, offering, refresh, router]);

  return { presentPaywall, presentingPaywall };
}
