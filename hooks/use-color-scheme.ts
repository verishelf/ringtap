import { useContext } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { AppearanceContext } from '@/contexts/AppearanceContext';

/** Returns effective color scheme: user preference from AppearanceContext, or system. */
export function useColorScheme(): 'light' | 'dark' {
  const appearance = useContext(AppearanceContext);
  const system = useRNColorScheme();
  return (appearance?.colorScheme ?? system ?? 'dark') as 'light' | 'dark';
}
