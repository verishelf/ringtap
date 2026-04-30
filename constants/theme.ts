/**
 * Futuristic monochrome luxury theme
 * Deep blacks, zinc/silver grays, crisp whites, geometric fonts
 */

import { Platform } from 'react-native';

// Monochrome luxury palette
const black = '#0A0A0B';
const surface = '#141416';
const surfaceElevated = '#1A1A1D';
const border = '#27272A';
const borderLight = '#3F3F46';
const zinc = '#71717A';
const zincLight = '#A1A1AA';
const silver = '#D4D4D8';
const white = '#FAFAFA';
const pureWhite = '#FFFFFF';
const accent = '#E4E4E7'; // silver highlight for interactive
const muted = '#52525B';

/** Monochrome luxury tokens for use in StyleSheet (dark-first) */
export const Tokens = {
  pureWhite,
  primary: black,
  background: black,
  surface: surface,
  surfaceElevated: surfaceElevated,
  border: border,
  borderLight: borderLight,
  text: white,
  textSecondary: zincLight,
  muted: zinc,
  accent: silver,
  destructive: '#EF4444',
  inputBorder: borderLight,
  card: surfaceElevated,
  cardBorder: border,
} as const;

/** Layout: spacing, radii, typography — use everywhere for congruence */
export const Layout = {
  // Spacing
  screenPadding: 20,
  screenPaddingBottom: 40,
  tabBarHeight: 49,
  sectionGap: 24,
  cardPadding: 20,
  inputGap: 12,
  rowGap: 12,
  tightGap: 8,
  // Radii
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,
  radiusPill: 999,
  // Inputs / buttons
  inputHeight: 48,
  buttonHeight: 48,
  // Typography
  titleSection: 17,
  titleSectionMarginBottom: 6,
  subtitleSection: 13,
  subtitleSectionMarginBottom: 12,
  body: 16,
  bodySmall: 14,
  caption: 13,
  labelMarginBottom: 8,
  inputMarginBottom: 10,
} as const;

// Light theme: match onboarding (welcome / questionnaire) — #FAFAFA, crisp type, soft borders
const lightBg = '#FAFAFA';
const lightSurface = '#FFFFFF';
const lightSurfaceElevated = '#F3F3F3';
const lightBorder = '#E0E0E0';
const lightBorderLight = '#E8E8E8';
const lightText = '#111111';
const lightTextSecondary = '#5C5C5C';
/** Primary interactive / “on” controls (onboarding primary pill is this on #FAFAFA) */
const lightAccent = '#111111';

/** Text & icons on filled accent buttons */
const lightOnAccent = '#FFFFFF';
const darkOnAccent = '#0A0A0B';

export const Colors = {
  light: {
    text: lightText,
    textSecondary: lightTextSecondary,
    background: lightBg,
    surface: lightSurface,
    surfaceElevated: lightSurfaceElevated,
    border: lightBorder,
    borderLight: lightBorderLight,
    tint: lightText,
    primary: black,
    accent: lightAccent,
    onAccent: lightOnAccent,
    icon: lightTextSecondary,
    tabIconDefault: lightTextSecondary,
    tabIconSelected: lightText,
    tabBarBackground: lightSurface,
    tabBarBorder: lightBorderLight,
    inputBackground: lightSurfaceElevated,
    inputBorder: lightBorderLight,
    card: lightSurface,
    cardBorder: lightBorderLight,
    destructive: '#EF4444',
  },
  dark: {
    text: white,
    textSecondary: zincLight,
    background: black,
    surface: surface,
    surfaceElevated: surfaceElevated,
    border: border,
    borderLight: borderLight,
    tint: pureWhite,
    primary: black,
    accent: silver,
    onAccent: darkOnAccent,
    icon: zincLight,
    tabIconDefault: zincLight,
    tabIconSelected: pureWhite,
    tabBarBackground: surface,
    tabBarBorder: border,
    inputBackground: surfaceElevated,
    inputBorder: borderLight,
    card: surfaceElevated,
    cardBorder: border,
    destructive: '#EF4444',
  },
};

/** Futuristic geometric — load via @expo-google-fonts/space-grotesk; falls back to system when not loaded */
export const FontFamily = {
  heading: 'SpaceGrotesk_700Bold',
  headingMedium: 'SpaceGrotesk_600SemiBold',
  body: 'SpaceGrotesk_400Regular',
  bodyMedium: 'SpaceGrotesk_500Medium',
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

export const Fonts = Platform.select({
  ios: {
    sans: FontFamily.body,
    serif: 'Georgia',
    rounded: 'System',
    mono: FontFamily.mono ?? 'Menlo',
  },
  default: {
    sans: FontFamily.body,
    serif: 'serif',
    rounded: 'normal',
    mono: FontFamily.mono ?? 'monospace',
  },
  web: {
    sans: `"Space Grotesk", system-ui, -apple-system, sans-serif`,
    serif: "Georgia, 'Times New Roman', serif",
    rounded: `"Space Grotesk", system-ui, sans-serif`,
    mono: "ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, monospace",
  },
});
