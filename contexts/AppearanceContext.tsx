import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
const STORAGE_KEY = 'ringtap_appearance';

type ThemeMode = 'light' | 'dark';

type AppearanceContextValue = {
  /** User preference: 'light' | 'dark'. When set, overrides default. */
  theme: ThemeMode | null;
  setTheme: (mode: ThemeMode | null) => void;
  /** Effective scheme: stored theme, else dark. */
  colorScheme: 'light' | 'dark';
  isLight: boolean;
};

export const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') {
        setThemeState(stored);
      }
    });
  }, []);

  const setTheme = useCallback((mode: ThemeMode | null) => {
    setThemeState(mode);
    if (mode === null) {
      SecureStore.deleteItemAsync(STORAGE_KEY);
    } else {
      SecureStore.setItemAsync(STORAGE_KEY, mode);
    }
  }, []);

  /** No stored preference defaults to dark (not system light). */
  const colorScheme = (theme ?? 'dark') as 'light' | 'dark';
  const isLight = colorScheme === 'light';

  const value: AppearanceContextValue = {
    theme,
    setTheme,
    colorScheme,
    isLight,
  };

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) {
    return {
      theme: null,
      setTheme: () => {},
      colorScheme: 'dark' as const,
      isLight: false,
    };
  }
  return ctx;
}

/** Returns effective color scheme for theming (user preference or app default). */
export function useEffectiveColorScheme(): 'light' | 'dark' {
  return useAppearance().colorScheme;
}
