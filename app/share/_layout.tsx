import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useThemeColors';

export default function ShareLayout() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        headerStatusBarHeight: insets.top,
        headerStyle: { backgroundColor: colors.background },
        contentStyle: { paddingBottom: insets.bottom },
      }}
    >
      <Stack.Screen name="nfc" options={{ title: 'NFC Share' }} />
      <Stack.Screen name="qr" options={{ title: 'QR Code' }} />
    </Stack>
  );
}
