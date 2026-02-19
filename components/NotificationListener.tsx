/**
 * Listens for notification taps and navigates to the relevant screen.
 * Message notifications include conversationId in data → open that conversation.
 */

import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export function NotificationListener() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const conversationId = data?.conversationId as string | undefined;
      if (conversationId) {
        router.push(`/messages/${conversationId}` as const);
      } else {
        router.push('/messages');
      }
    });

    return () => sub.remove();
  }, [router]);

  return null;
}
