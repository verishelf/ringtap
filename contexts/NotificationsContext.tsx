import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { setupAndroidNotificationChannel } from '@/utils/registerPushNotifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const STORAGE_KEY = 'ringtap_notification_prefs';

export type NotificationPrefs = {
  newMessages: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  newMessages: true,
};

type NotificationsContextValue = {
  prefs: NotificationPrefs;
  setPrefs: (next: Partial<NotificationPrefs>) => void;
  permissionStatus: Notifications.PermissionStatus | null;
  requestPermission: () => Promise<boolean>;
};

export const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefsState] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
          setPrefsState((p) => ({ ...p, ...parsed }));
        } catch {
          // ignore
        }
      }
    });
  }, []);

  useEffect(() => {
    Notifications.getPermissionsAsync().then(setPermissionStatus);
  }, []);

  const setPrefs = useCallback((next: Partial<NotificationPrefs>) => {
    setPrefsState((prev) => {
      const updated = { ...prev, ...next };
      SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    await setupAndroidNotificationChannel();
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') {
      setPermissionStatus('granted');
      return true;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);
    return status === 'granted';
  }, []);

  const value: NotificationsContextValue = {
    prefs,
    setPrefs,
    permissionStatus,
    requestPermission,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    return {
      prefs: DEFAULT_PREFS,
      setPrefs: () => {},
      permissionStatus: null,
      requestPermission: async () => false,
    };
  }
  return ctx;
}
