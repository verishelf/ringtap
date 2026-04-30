/**
 * Listens for notification taps and navigates to the relevant screen.
 * Message notifications include conversationId; contact notifications include type + fromUserId.
 */

import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export function NotificationListener() {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      const t = data?.type;
      if (t === 'contact' && data?.fromUserId && typeof data.fromUserId === 'string') {
        const id = data.fromUserId;
        router.push(`/profile/${id}` as Href);
        return;
      }
      if (t === 'contact') {
        router.push('/(tabs)/contacts' as Href);
        return;
      }
      const conversationId = data?.conversationId as string | undefined;
      if (conversationId) {
        router.push(`/messages/${conversationId}` as Href);
      } else {
        router.push('/messages' as Href);
      }
    });

    return () => sub.remove();
  }, [router]);

  return null;
}
