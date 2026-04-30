import { useGlobalSearchParams, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { NativeModules, Platform } from 'react-native';

type AnalyticsParams = Record<string, string | number | boolean>;

function getNativeAnalytics() {
  if (Platform.OS === 'web') return null;
  // Expo Go and any build without native Firebase do not expose RNFBAppModule — never
  // require() RN Firebase in that case or the bridge throws before try/catch helps.
  if (NativeModules.RNFBAppModule == null) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@react-native-firebase/analytics').default as typeof import('@react-native-firebase/analytics').default;
    return mod();
  } catch {
    return null;
  }
}

/**
 * Logs a custom Analytics event (no-op on web or if the native module is unavailable).
 */
export async function logAnalyticsEvent(
  name: string,
  params?: AnalyticsParams,
): Promise<void> {
  const instance = getNativeAnalytics();
  if (!instance) return;
  try {
    await instance.logEvent(name, params);
  } catch {
    // Native dev client missing rebuild, or misconfiguration
  }
}

/**
 * Tracks screen views from Expo Router's active pathname (and search params).
 * Call once from the root layout.
 */
export function useAnalyticsScreenTracking(): void {
  const pathname = usePathname();
  const searchParams = useGlobalSearchParams();
  const paramsKey = JSON.stringify(searchParams ?? {});

  useEffect(() => {
    const instance = getNativeAnalytics();
    if (!instance) return;

    const screenName = pathname || '/';
    const base = screenName.replace(/^\//, '') || 'index';
    const screenClass = `${base}`.slice(0, 100);

    void (async () => {
      try {
        await instance.logScreenView({
          screen_name: screenName.slice(0, 100),
          screen_class: screenClass,
        });
      } catch {
        // ignore
      }
    })();
  }, [pathname, paramsKey]);
}
