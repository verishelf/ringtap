import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type OnboardingOptionIcon = ComponentProps<typeof Ionicons>['name'];

export const ONBOARDING_STEP_IDS = ['goal', 'shareMethod', 'role', 'familiarity'] as const;

export type OnboardingStepId = (typeof ONBOARDING_STEP_IDS)[number];

export type OnboardingStepDef = {
  id: OnboardingStepId;
  title: string;
  subtitle: string;
  options: { value: string; label: string; icon: OnboardingOptionIcon }[];
};

export const ONBOARDING_STEPS: OnboardingStepDef[] = [
  {
    id: 'goal',
    title: 'What’s your main goal?',
    subtitle: 'We’ll tailor tips in the app and prioritize features that matter to you.',
    options: [
      { value: 'Networking', label: 'Networking', icon: 'people-outline' },
      { value: 'Sales & leads', label: 'Sales & leads', icon: 'trending-up-outline' },
      { value: 'Job search', label: 'Job search', icon: 'briefcase-outline' },
      { value: 'Events & conferences', label: 'Events & conferences', icon: 'calendar-outline' },
      { value: 'Portfolio / creative', label: 'Portfolio / creative', icon: 'color-palette-outline' },
      { value: 'Other', label: 'Other', icon: 'sparkles-outline' },
    ],
  },
  {
    id: 'shareMethod',
    title: 'How will you share your card?',
    subtitle: 'This helps us surface the right setup steps for NFC, QR, or links.',
    options: [
      { value: 'NFC ring or card', label: 'NFC ring or card', icon: 'hardware-chip-outline' },
      { value: 'QR code', label: 'QR code', icon: 'qr-code-outline' },
      { value: 'Link only', label: 'Link only', icon: 'link-outline' },
      { value: 'Not sure yet', label: 'Not sure yet', icon: 'help-circle-outline' },
    ],
  },
  {
    id: 'role',
    title: 'What best describes you?',
    subtitle: 'Optional: we can add this to your profile headline if it’s empty.',
    options: [
      { value: 'Founder', label: 'Founder', icon: 'rocket-outline' },
      { value: 'Sales / BD', label: 'Sales / BD', icon: 'chatbubbles-outline' },
      { value: 'Student', label: 'Student', icon: 'school-outline' },
      { value: 'Engineer / product', label: 'Engineer / product', icon: 'code-slash-outline' },
      { value: 'Marketing', label: 'Marketing', icon: 'megaphone-outline' },
      { value: 'Other', label: 'Other', icon: 'person-outline' },
    ],
  },
  {
    id: 'familiarity',
    title: 'Digital cards',
    subtitle: 'This helps us calibrate onboarding and future personalization.',
    options: [
      { value: 'New to digital cards', label: 'New to digital cards', icon: 'leaf-outline' },
      { value: 'I’ve used one before', label: 'I’ve used one before', icon: 'layers-outline' },
    ],
  },
];
