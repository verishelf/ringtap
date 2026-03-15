import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useThemeColors';

export default function MessagesLayout() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStatusBarHeight: insets.top,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerBackTitle: '',
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { paddingBottom: insets.bottom },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Messages', headerLeft: () => null }} />
      <Stack.Screen name="[conversationId]" options={{ title: 'Chat' }} />
    </Stack>
  );
}
