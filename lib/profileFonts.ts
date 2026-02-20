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
    case 'akronim':
      return 'Akronim_400Regular';
    case 'fugaz_one':
      return 'FugazOne_400Regular';
    case 'rubik_glitch':
      return 'RubikGlitch_400Regular';
    case 'rubik_puddles':
      return 'RubikPuddles_400Regular';
    case 'trade_winds':
      return 'TradeWinds_400Regular';
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
    case 'akronim':
      return '"Akronim", system-ui, sans-serif';
    case 'fugaz_one':
      return '"Fugaz One", system-ui, sans-serif';
    case 'rubik_glitch':
      return '"Rubik Glitch", system-ui, sans-serif';
    case 'rubik_puddles':
      return '"Rubik Puddles", system-ui, sans-serif';
    case 'trade_winds':
      return '"Trade Winds", system-ui, sans-serif';
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

/** Extra styles for dots fonts (raleway_dots, zen_dots) — disabled; dots fonts use normal theme colors */
export function getDotsFontEnhancement(_typography?: TypographyStyle | null): { color: string; textShadowColor?: string; textShadowOffset?: { width: number; height: number }; textShadowRadius?: number } | null {
  return null;
}

/** Extra styles for dots fonts on web — disabled; dots fonts use normal theme colors */
export function getDotsFontEnhancementWeb(_typography?: TypographyStyle | null): Record<string, string | number> | null {
  return null;
}

export const TYPOGRAPHY_OPTIONS: { value: TypographyStyle; label: string }[] = [
  { value: 'sans', label: 'Sans' },
  { value: 'serif', label: 'Serif' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'mono', label: 'Mono' },
  { value: 'orbitron', label: 'Orbitron' },
  { value: 'raleway_dots', label: 'Raleway Dots' },
  { value: 'zen_dots', label: 'Zen Dots' },
  { value: 'akronim', label: 'Akronim' },
  { value: 'fugaz_one', label: 'Fugaz One' },
  { value: 'rubik_glitch', label: 'Rubik Glitch' },
  { value: 'rubik_puddles', label: 'Rubik Puddles' },
  { value: 'trade_winds', label: 'Trade Winds' },
];
