/**
 * Profile typography font mapping.
 * Used for profile display (name, title, bio) in app and web.
 */

import { Platform } from 'react-native';
import type { TypographyStyle } from '@/lib/supabase/types';

/** Font family for profile text (React Native) */
export function getProfileFontFamily(typography?: TypographyStyle | null): string {
  const style = typography ?? 'sans';
  switch (style) {
    case 'orbitron':
      return 'Orbitron_400Regular';
    case 'raleway_dots':
      return 'RalewayDots_400Regular';
    case 'zen_dots':
      return 'ZenDots_400Regular';
    case 'serif':
      return Platform.OS === 'ios' ? 'Georgia' : 'serif';
    case 'mono':
      return Platform.OS === 'ios' ? 'Menlo' : 'monospace';
    case 'rounded':
      return 'SpaceGrotesk_400Regular';
    default:
      return 'SpaceGrotesk_400Regular';
  }
}

/** Font family for profile text (web CSS) */
export function getProfileFontFamilyWeb(typography?: TypographyStyle | null): string {
  const style = typography ?? 'sans';
  switch (style) {
    case 'orbitron':
      return '"Orbitron", system-ui, sans-serif';
    case 'raleway_dots':
      return '"Raleway Dots", system-ui, sans-serif';
    case 'zen_dots':
      return '"Zen Dots", system-ui, sans-serif';
    case 'serif':
      return "Georgia, 'Times New Roman', serif";
    case 'mono':
      return "ui-monospace, 'Cascadia Code', Menlo, monospace";
    case 'rounded':
      return '"Space Grotesk", system-ui, sans-serif';
    default:
      return '"Space Grotesk", system-ui, sans-serif';
  }
}

export const TYPOGRAPHY_OPTIONS: { value: TypographyStyle; label: string }[] = [
  { value: 'sans', label: 'Sans' },
  { value: 'serif', label: 'Serif' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'mono', label: 'Mono' },
  { value: 'orbitron', label: 'Orbitron' },
  { value: 'raleway_dots', label: 'Raleway Dots' },
  { value: 'zen_dots', label: 'Zen Dots' },
];
