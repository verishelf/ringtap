import { Stack } from 'expo-router';

export default function ShareLayout() {
  return (
    <Stack>
      <Stack.Screen name="nfc" options={{ title: 'NFC Share' }} />
      <Stack.Screen name="qr" options={{ title: 'QR Code' }} />
      <Stack.Screen name="lock-screen" options={{ title: 'QR on Lock Screen' }} />
    </Stack>
  );
}
