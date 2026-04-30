import { Stack } from 'expo-router';

import { useThemeColors } from '@/hooks/useThemeColors';

export default function ProfileLayout() {
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerShadowVisible: true,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          title: 'Profile',
          headerLargeTitle: false,
          headerBackTitle: '',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
        }}
      />
    </Stack>
  );
}
