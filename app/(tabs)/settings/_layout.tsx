import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="pricing" options={{ title: 'Pricing' }} />
      <Stack.Screen name="upgrade" options={{ title: 'Upgrade to Pro' }} />
      <Stack.Screen name="manage" options={{ title: 'Manage Subscription' }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
    </Stack>
  );
}
