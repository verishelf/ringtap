import { Stack } from 'expo-router';

export default function ScannedContactLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" options={{ title: 'Business card' }} />
    </Stack>
  );
}
