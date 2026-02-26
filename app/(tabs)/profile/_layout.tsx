import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#0A0A0B' },
        headerTintColor: '#FAFAFA',
        headerTitleStyle: { fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 17 },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
    </Stack>
  );
}
