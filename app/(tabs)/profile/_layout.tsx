import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

export default function ProfileLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStatusBarHeight: insets.top,
        headerBackground: () => <View style={{ flex: 1, backgroundColor: '#0A0A0B' }} />,
        headerStyle: { backgroundColor: '#0A0A0B' },
        headerShadowVisible: false,
        headerTintColor: '#FAFAFA',
        headerTitleStyle: { fontSize: 17, fontWeight: '600' },
        headerBackTitle: '',
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: '#0A0A0B' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="links" options={{ title: 'Links' }} />
      <Stack.Screen name="feed" options={{ title: 'Opportunities' }} />
      <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Stack.Screen name="upgrade" options={{ title: 'Subscription' }} />
      <Stack.Screen name="manage" options={{ title: 'Manage Subscription', headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="about" options={{ title: 'About', headerShown: false }} />
    </Stack>
  );
}
