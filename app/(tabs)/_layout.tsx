import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import {
    Icon,
    Label,
    NativeTabs,
} from 'expo-router/unstable-native-tabs';
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

function AndroidTabs() {
  const colorScheme = useColorScheme();
  const c = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();

  return (
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
        tabBarBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: colorScheme === 'dark' ? '#0A0A0B' : 'rgba(250,250,250,0.92)',
                overflow: 'hidden',
              },
            ]}
          />
        ),
        sceneStyle: { paddingBottom: insets.bottom + TAB_BAR_HEIGHT },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="home"
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

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const c = Colors[colorScheme ?? 'dark'];
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

  // iOS: native liquid glass tab bar with sliding minimize on scroll, dark theme
  if (Platform.OS === 'ios') {
    return (
      <>
        <NotificationListener />
        <NativeTabs
          minimizeBehavior="onScrollDown"
          iconColor="#FAFAFA"
          tintColor="#FAFAFA"
          backgroundColor="#0A0A0B"
          blurEffect="systemChromeMaterialDark"
          labelStyle={{ color: '#A1A1AA' }}
        >
          <NativeTabs.Trigger name="home">
            <Label>Home</Label>
            <Icon sf={{ default: 'house', selected: 'house.fill' }} />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="profile">
            <Label>Profile</Label>
            <Icon sf={{ default: 'person', selected: 'person.fill' }} />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="contacts">
            <Label>Contacts</Label>
            <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="links">
            <Label>Links</Label>
            <Icon sf={{ default: 'link', selected: 'link' }} />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="analytics">
            <Label>Analytics</Label>
            <Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="settings" disableScrollToTop>
            <Label>Settings</Label>
            <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
          </NativeTabs.Trigger>
        </NativeTabs>
      </>
    );
  }

  // Android & web: standard tabs with glass-style overlay
  return (
    <>
      <NotificationListener />
      <AndroidTabs />
    </>
  );
}
