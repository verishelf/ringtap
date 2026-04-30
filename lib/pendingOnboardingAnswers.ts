import AsyncStorage from '@react-native-async-storage/async-storage';

import type { OnboardingAnswersV1 } from '@/lib/supabase/types';

const KEY = 'ringtap_pending_onboarding_answers_v1';

export type PendingOnboardingPayload = Omit<OnboardingAnswersV1, 'version'>;

export async function savePendingOnboardingAnswers(answers: PendingOnboardingPayload): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(answers));
}

export async function getPendingOnboardingAnswers(): Promise<PendingOnboardingPayload | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingOnboardingPayload>;
    if (
      typeof parsed.goal === 'string' &&
      typeof parsed.shareMethod === 'string' &&
      typeof parsed.role === 'string' &&
      typeof parsed.familiarity === 'string'
    ) {
      return parsed as PendingOnboardingPayload;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function clearPendingOnboardingAnswers(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
