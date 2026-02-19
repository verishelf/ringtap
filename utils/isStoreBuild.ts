import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Returns true when the app is a production store build (TestFlight, App Store).
 * EAS builds report ExecutionEnvironment.Bare or Standalone.
 * Use this as the ONLY condition for enabling/disabling IAP.
 */
export function isStoreBuild(): boolean {
  if (__DEV__) return false;
  const env = Constants.executionEnvironment;
  if (env === ExecutionEnvironment.Standalone || env === ExecutionEnvironment.Bare) {
    return true;
  }
  // Fallback: production builds on native typically have executionEnvironment set.
  // If undefined in an edge case, assume store build when not in __DEV__ on device.
  if (env === undefined && Platform.OS !== 'web') {
    return true;
  }
  return false;
}
