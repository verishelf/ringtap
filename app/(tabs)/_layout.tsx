import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSession } from '@/hooks/useSession';
import { savePushToken } from '@/lib/api';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const c = Colors[colorScheme ?? 'dark'];
  const { user } = useSession();
  const { prefs, permissionStatus } = useNotifications();

  useEffect(() => {
    if (Platform.OS === 'web' || !user?.id || permissionStatus !== 'granted' || !prefs.newMessages) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId) return;
    let cancelled = false;
    Notifications.getExpoPushTokenAsync({ projectId })
      .then(({ data: token }) => {
        if (!cancelled) savePushToken(user.id, token, Platform.OS).catch(() => {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id, permissionStatus, prefs.newMessages]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.tabIconSelected,
        tabBarInactiveTintColor: c.tabIconDefault,
        tabBarStyle: {
          backgroundColor: c.tabBarBackground,
          borderTopColor: c.tabBarBorder,
          borderTopWidth: 1,
        },
        headerStyle: { backgroundColor: c.background },
        headerTintColor: c.text,
        headerTitleStyle: { fontFamily: 'SpaceGrotesk_600SemiBold', fontSize: 17 },
        headerShown: true,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contacts"
        options={{
          title: 'Contacts',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="links"
        options={{
          title: 'Links',
          tabBarIcon: ({ color, size }) => <Ionicons name="link" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
