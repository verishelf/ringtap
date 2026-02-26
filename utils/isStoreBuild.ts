import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Returns true when the app is a production store build (TestFlight, App Store).
 * EAS builds report ExecutionEnvironment.Bare or Standalone.
 * StoreClient = Expo Go (IAP disabled). Use this as the ONLY condition for enabling/disabling IAP.
 */
export function isStoreBuild(): boolean {
  if (Platform.OS === 'web') return false;
  if (__DEV__) return false;
  const env = Constants.executionEnvironment;
  // Explicitly disable only for Expo Go
  if (env === ExecutionEnvironment.StoreClient) return false;
  // Enable for Standalone, Bare, or undefined (TestFlight/some EAS builds may report undefined)
  if (
    env === ExecutionEnvironment.Standalone ||
    env === ExecutionEnvironment.Bare ||
    env === undefined
  ) {
    return true;
  }
  return false;
}
