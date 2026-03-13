import { Stack } from 'expo-router';

export default function ContactsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Contacts' }} />
      <Stack.Screen name="scanned/[id]" options={{ title: 'Business card' }} />
    </Stack>
  );
}
