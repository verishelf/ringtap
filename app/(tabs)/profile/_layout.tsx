import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useEffectiveColorScheme } from '@/contexts/AppearanceContext';

export default function ProfileLayout() {
  const insets = useSafeAreaInsets();
  const scheme = useEffectiveColorScheme();
  const c = Colors[scheme];

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStatusBarHeight: insets.top,
        headerBackground: () => <View style={{ flex: 1, backgroundColor: c.background }} />,
        headerStyle: { backgroundColor: c.background },
        headerShadowVisible: false,
        headerTintColor: c.text,
        headerTitleStyle: { fontSize: 17, fontWeight: '600', color: c.text },
        headerBackTitle: '',
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: c.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="links" options={{ title: 'Links' }} />
      <Stack.Screen name="feed" options={{ title: 'Opportunities' }} />
      <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Stack.Screen name="upgrade" options={{ title: 'Subscription' }} />
      <Stack.Screen name="manage" options={{ title: 'Manage Subscription', headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="badges" options={{ title: 'Badges', headerShown: false }} />
      <Stack.Screen name="integrations" options={{ title: 'Integrations', headerShown: false }} />
      <Stack.Screen name="lead-capture" options={{ title: 'Lead capture', headerShown: false }} />
      <Stack.Screen name="help" options={{ title: 'Help', headerShown: false }} />
      <Stack.Screen name="about" options={{ title: 'About', headerShown: false }} />
    </Stack>
  );
}
