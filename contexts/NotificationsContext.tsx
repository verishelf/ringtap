import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import {
  deleteAllPushTokensForUser,
  fetchNotificationSettingsForUser,
  upsertNotificationSettings,
} from '@/lib/api';
import { supabase } from '@/lib/supabase/supabaseClient';
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
  newContacts: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  newMessages: true,
  newContacts: true,
};

type NotificationsContextValue = {
  prefs: NotificationPrefs;
  setPrefs: (next: Partial<NotificationPrefs>) => void;
  permissionStatus: Notifications.PermissionStatus | null;
  requestPermission: () => Promise<boolean>;
};

export const NotificationsContext = createContext<NotificationsContextValue | null>(null);

function mergePartialPrefs(
  raw: unknown
): Partial<NotificationPrefs> {
  if (!raw || typeof raw !== 'object') return {};
  const o = raw as Record<string, unknown>;
  const out: Partial<NotificationPrefs> = {};
  if (typeof o.newMessages === 'boolean') out.newMessages = o.newMessages;
  if (typeof o.newContacts === 'boolean') out.newContacts = o.newContacts;
  return out;
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefsState] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = mergePartialPrefs(JSON.parse(raw));
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

  useEffect(() => {
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const row = await fetchNotificationSettingsForUser(session.user.id);
        if (row) {
          setPrefsState((p) => ({ ...p, newMessages: row.newMessages, newContacts: row.newContacts }));
        }
      }
    })();
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== 'SIGNED_IN' || !session?.user) return;
      void fetchNotificationSettingsForUser(session.user.id).then((row) => {
        if (row) {
          setPrefsState((p) => ({ ...p, newMessages: row.newMessages, newContacts: row.newContacts }));
        }
      });
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const setPrefs = useCallback((next: Partial<NotificationPrefs>) => {
    setPrefsState((prev) => {
      const updated: NotificationPrefs = { ...prev, ...next };
      void SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(updated));
      void (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await upsertNotificationSettings({
            newMessages: updated.newMessages,
            newContacts: updated.newContacts,
          });
          if (!updated.newMessages && !updated.newContacts) {
            await deleteAllPushTokensForUser();
          }
        }
      })();
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
