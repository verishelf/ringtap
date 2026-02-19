import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * Returns true when the app is a production store build (TestFlight, App Store).
 * EAS builds report ExecutionEnvironment.Bare ("bare"), not Standalone.
 * Use this as the ONLY condition for enabling/disabling IAP.
 */
export function isStoreBuild(): boolean {
  if (__DEV__) return false;
  const env = Constants.executionEnvironment;
  return env === ExecutionEnvironment.Standalone || env === ExecutionEnvironment.Bare;
}
