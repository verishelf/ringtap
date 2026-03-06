import { Ionicons } from '@expo/vector-icons';
import { Tabs, useSegments } from 'expo-router';
import {
    Icon,
    Label,
    NativeTabs,
} from 'expo-router/unstable-native-tabs';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as Haptics from 'expo-haptics';
import { NotificationListener } from '@/components/NotificationListener';
import { Colors } from '@/constants/theme';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useSession } from '@/hooks/useSession';
import { savePushToken } from '@/lib/api';
import { getExpoPushTokenAsync } from '@/utils/registerPushNotifications';

const TAB_BAR_HEIGHT = 49;

function AndroidTabs() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        },
      }}
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
                backgroundColor: '#0A0A0B',
                overflow: 'hidden',
              },
            ]}
          />
        ),
        sceneStyle: { paddingBottom: insets.bottom + TAB_BAR_HEIGHT },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ href: null }}
      />
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

function NativeTabHaptic() {
  const segments = useSegments();
  const prevTab = React.useRef<string | null>(null);

  React.useEffect(() => {
    const tab = (typeof segments[1] === 'string' ? segments[1] : '') as string;
    if (prevTab.current !== null && prevTab.current !== tab) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    prevTab.current = tab;
  }, [segments]);

  return null;
}

export default function TabLayout() {
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
        <NativeTabHaptic />
        <NativeTabs
          minimizeBehavior="onScrollDown"
          iconColor="#FAFAFA"
          tintColor="#FAFAFA"
          backgroundColor="#0A0A0B"
          blurEffect="dark"
          disableTransparentOnScrollEdge
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
