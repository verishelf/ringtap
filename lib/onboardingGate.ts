import type { Href } from 'expo-router';

import {
  completeOnboarding,
  getOnboardingStatus,
  getProfilePlanFromApi,
  getSubscription,
} from '@/lib/api';
import { hasSeenOnboardingPaywall } from '@/lib/onboardingPaywallSeen';
import {
  clearPendingOnboardingAnswers,
  getPendingOnboardingAnswers,
} from '@/lib/pendingOnboardingAnswers';

export function getIndexPath(isAuthenticated: boolean, onboardingCompleted: boolean): Href {
  if (!isAuthenticated) return '/onboarding/welcome';
  if (!onboardingCompleted) return '/onboarding/questionnaire';
  return '/(tabs)/home';
}

export function getPostAuthPath(onboardingCompleted: boolean): Href {
  if (!onboardingCompleted) return '/onboarding/questionnaire';
  return '/(tabs)/home';
}

/**
 * After sign-in: if the user finished the questionnaire before creating an account,
 * persist answers to Supabase, then send them to upsell (free) or home (Pro).
 */
export async function resolveAuthenticatedOnboardingRoute(userId: string): Promise<Href> {
  const pending = await getPendingOnboardingAnswers();
  if (pending) {
    const result = await completeOnboarding(userId, pending);
    await clearPendingOnboardingAnswers();
    if (!result.success) {
      const { completed } = await getOnboardingStatus(userId);
      return getPostAuthPath(completed);
    }
    const sub = await getSubscription(userId);
    const apiPlan = await getProfilePlanFromApi(userId);
    const isPro =
      (sub?.plan as string | undefined) === 'pro' || apiPlan === 'pro';
    if (isPro) return '/(tabs)/home';
    const alreadySawPaywall = await hasSeenOnboardingPaywall(userId);
    return alreadySawPaywall ? '/(tabs)/home' : '/onboarding/upsell';
  }
  const { completed } = await getOnboardingStatus(userId);
  return getPostAuthPath(completed);
}
