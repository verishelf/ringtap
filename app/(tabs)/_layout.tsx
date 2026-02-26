import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { NotificationListener } from '@/components/NotificationListener';
import { Colors } from '@/constants/theme';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSession } from '@/hooks/useSession';
import { savePushToken } from '@/lib/api';
import { getExpoPushTokenAsync } from '@/utils/registerPushNotifications';

const TAB_BAR_HEIGHT = 49;

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const c = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const { prefs, permissionStatus } = useNotifications();

  useEffect(() => {
    if (Platform.OS === 'web' || !user?.id || permissionStatus !== 'granted' || !prefs.newMessages) return;
    let cancelled = false;
    getExpoPushTokenAsync()
      .then((token) => {
        if (!cancelled && token) savePushToken(user.id, token, Platform.OS).catch(() => {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id, permissionStatus, prefs.newMessages]);

  return (
    <>
      <NotificationListener />
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.tabIconSelected,
        tabBarInactiveTintColor: c.tabIconDefault,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: c.tabBarBorder + '50',
          elevation: 0,
          shadowOpacity: 0,
          overflow: 'hidden',
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              intensity={60}
              style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: colorScheme === 'dark' ? 'rgba(20,20,22,0.4)' : 'rgba(250,250,250,0.4)',
                  overflow: 'hidden',
                },
              ]}
            />
          ),
        sceneStyle: { paddingBottom: insets.bottom + TAB_BAR_HEIGHT },
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
    </>
  );
}
