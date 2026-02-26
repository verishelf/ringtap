import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#0A0A0B' },
        headerTintColor: '#FAFAFA',
        headerTitleStyle: { fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 17 },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="pricing" options={{ title: 'Pricing' }} />
      <Stack.Screen name="upgrade" options={{ title: 'Upgrade to Pro' }} />
      <Stack.Screen name="manage" options={{ title: 'Manage Subscription' }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
    </Stack>
  );
}
