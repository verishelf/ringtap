import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { Stack } from 'expo-router';

import { useThemeColors } from '@/hooks/useThemeColors';

export default function MessagesLayout() {
  const router = useRouter();
  const colors = useThemeColors();
  const backButton = () => (
    <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 8, marginLeft: 4 }}>
      <Ionicons name="arrow-back" size={24} color={colors.text} />
    </Pressable>
  );

  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="index" options={{ title: 'Messages', headerLeft: backButton }} />
      <Stack.Screen
        name="[conversationId]"
        options={{ title: 'Chat', headerLeft: backButton }}
      />
    </Stack>
  );
}
