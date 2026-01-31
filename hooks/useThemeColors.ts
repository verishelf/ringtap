import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMemo } from 'react';

export type ThemeColors = typeof Colors.dark;

export function useThemeColors(): ThemeColors {
  const colorScheme = useColorScheme();
  return useMemo(
    () => Colors[colorScheme ?? 'dark'] as ThemeColors,
    [colorScheme]
  );
}
