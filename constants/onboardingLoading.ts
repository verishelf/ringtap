import { Platform } from 'react-native';

/** While checking auth/session before the questionnaire loads */
export const ONBOARDING_AUTH_LOADING_LABELS = [
  'Loading your profile…',
  'Customising your card…',
  'Setting things up…',
] as const;

/** After Continue on the final step — saving answers or navigating to signup */
export const ONBOARDING_SUBMIT_LOADING_LABELS = [
  'Saving your preferences…',
  'Customising your card…',
  'Preparing your experience…',
  'Almost there…',
] as const;

/** Upsell bridge while Revenue Cat / paywall resolves */
export const ONBOARDING_UPSELL_LOADING_LABELS = [
  'Loading Pro benefits…',
  'Fine-tuning your card…',
  'Love RingTap? Leave us a review.',
] as const;

export function getAppStoreReviewUrl(): string {
  if (Platform.OS === 'android') {
    return 'https://play.google.com/store/apps/details?id=me.ringtap.app';
  }
  return 'https://apps.apple.com/app/id6758565822?action=write-review';
}
