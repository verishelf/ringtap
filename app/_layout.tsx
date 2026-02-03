import {
    DarkTheme as NavDarkTheme,
    DefaultTheme as NavDefaultTheme,
    ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';

import { Colors } from '@/constants/theme';
import { AppearanceProvider } from '@/contexts/AppearanceContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useActivation } from '@/hooks/useActivation';

SplashScreen.preventAutoHideAsync();

const LuxuryDarkTheme = {
  ...NavDarkTheme,
  colors: {
    ...NavDarkTheme.colors,
    primary: Colors.dark.tint,
    background: Colors.dark.background,
    card: Colors.dark.surface,
    text: Colors.dark.text,
    border: Colors.dark.border,
    notification: Colors.dark.accent,
  },
};

const LuxuryLightTheme = {
  ...NavDefaultTheme,
  colors: {
    ...NavDefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.surface,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.light.accent,
  },
};

function RootLayoutNav() {
  useActivation();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? LuxuryDarkTheme : LuxuryLightTheme;

  let fontMap: Record<string, unknown> = {};
  try {
    const sg = require('@expo-google-fonts/space-grotesk');
    fontMap = {
      SpaceGrotesk_400Regular: sg.SpaceGrotesk_400Regular,
      SpaceGrotesk_500Medium: sg.SpaceGrotesk_500Medium,
      SpaceGrotesk_600SemiBold: sg.SpaceGrotesk_600SemiBold,
      SpaceGrotesk_700Bold: sg.SpaceGrotesk_700Bold,
    };
  } catch {
    // Package not installed: run npx expo install @expo-google-fonts/space-grotesk expo-font
  }
  const [fontsLoaded, fontError] = useFonts(fontMap as Parameters<typeof useFonts>[0]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="activate" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="share" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppearanceProvider>
        <RootLayoutNav />
      </AppearanceProvider>
    </AuthProvider>
  );
}
