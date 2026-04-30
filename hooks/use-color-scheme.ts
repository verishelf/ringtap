import { useContext } from 'react';

import { AppearanceContext } from '@/contexts/AppearanceContext';

/** Returns effective color scheme: user preference from AppearanceContext, or dark. */
export function useColorScheme(): 'light' | 'dark' {
  const appearance = useContext(AppearanceContext);
  return (appearance?.colorScheme ?? 'dark') as 'light' | 'dark';
}
