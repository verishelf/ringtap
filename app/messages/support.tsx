import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { Layout } from '@/constants/theme';
import { useSession } from '@/hooks/useSession';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getOrCreateConversation } from '@/lib/api';
import { getSupportUserId } from '@/lib/support';

/**
 * Opens or creates the 1:1 conversation with the configured support user, then navigates to the chat.
 */
export default function SupportChatEntryScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useSession();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supportId = getSupportUserId();
    if (!user?.id) {
      router.replace('/messages');
      return;
    }
    if (!supportId) {
      setError('Support chat is not configured.');
      const t = setTimeout(() => router.replace('/messages'), 2000);
      return () => clearTimeout(t);
    }
    if (user.id === supportId) {
      router.replace('/messages');
      return;
    }
    let cancelled = false;
    getOrCreateConversation(user.id, supportId).then((conv) => {
      if (cancelled) return;
      if (conv) {
        router.replace(`/messages/${conv.id}` as const);
      } else {
        setError('Could not start chat. Try email from Help.');
        setTimeout(() => router.replace('/messages'), 2500);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: Layout.screenPadding }}>
      {error ? (
        <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>{error}</Text>
      ) : (
        <>
          <Image source={require('@/assets/images/loading.gif')} style={{ width: 48, height: 48 }} />
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Opening support…</Text>
        </>
      )}
    </View>
  );
}
