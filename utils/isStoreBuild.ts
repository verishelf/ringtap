import Constants from 'expo-constants';

/**
 * Returns true when the app is a production store build (TestFlight, App Store).
 * Use this as the ONLY condition for enabling/disabling IAP.
 */
export function isStoreBuild(): boolean {
  return Constants.executionEnvironment === 'standalone' && !__DEV__;
}
