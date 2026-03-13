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
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.scanTabIcon, { backgroundColor: focused ? '#E4E4E7' : 'rgba(255,255,255,0.15)' }]}>
              <Ionicons name="scan" size={26} color={focused ? '#0A0A0B' : '#A1A1AA'} />
            </View>
          ),
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
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      {/* Hidden routes - accessible via Profile */}
      <Tabs.Screen name="feed" options={{ href: null }} />
      <Tabs.Screen name="links" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scanTabIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
  },
});

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

  // iOS: native liquid glass tab bar
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
          <NativeTabs.Trigger name="map">
            <Label>Map</Label>
            <Icon sf={{ default: 'map', selected: 'map.fill' }} />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="scan">
            <Label>Scan</Label>
            <Icon sf={{ default: 'viewfinder', selected: 'viewfinder' }} />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="contacts">
            <Label>Contacts</Label>
            <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name="profile" disableScrollToTop>
            <Label>Profile</Label>
            <Icon sf={{ default: 'person', selected: 'person.fill' }} />
          </NativeTabs.Trigger>
        </NativeTabs>
      </>
    );
  }

  return (
    <>
      <NotificationListener />
      <AndroidTabs />
    </>
  );
}
