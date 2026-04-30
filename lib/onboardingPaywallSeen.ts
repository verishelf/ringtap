import AsyncStorage from '@react-native-async-storage/async-storage';

const keyFor = (userId: string) => `ringtap_onboarding_paywall_seen_${userId}`;

/** True after the user has completed the post-questionnaire upsell flow once (paywall or skip). */
export async function hasSeenOnboardingPaywall(userId: string): Promise<boolean> {
  if (!userId) return false;
  const v = await AsyncStorage.getItem(keyFor(userId));
  return v === '1';
}

export async function markOnboardingPaywallSeen(userId: string): Promise<void> {
  if (!userId) return;
  await AsyncStorage.setItem(keyFor(userId), '1');
}
