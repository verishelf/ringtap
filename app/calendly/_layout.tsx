import { Stack } from 'expo-router';

export default function CalendlyLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen name="connect" options={{ title: 'Connect Calendly' }} />
      <Stack.Screen name="appointments" options={{ title: 'My Appointments' }} />
      <Stack.Screen name="links" options={{ title: 'Booking Links' }} />
    </Stack>
  );
}
