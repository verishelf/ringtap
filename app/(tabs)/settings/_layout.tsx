import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="pricing" />
      <Stack.Screen name="upgrade" />
      <Stack.Screen name="manage" />
      <Stack.Screen name="about" />
    </Stack>
  );
}
