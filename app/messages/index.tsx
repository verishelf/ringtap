import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    ListRenderItem,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { FlatList, RectButton, Swipeable } from 'react-native-gesture-handler';

import { NameWithVerified, ProAvatar } from '@/components/ProBadge';
import { Layout } from '@/constants/theme';
import { useSession } from '@/hooks/useSession';
import { useThemeColors } from '@/hooks/useThemeColors';
import { deleteConversation, getConversations, type ConversationWithPeer } from '@/lib/api';
import { Pressable } from 'react-native';

const CHEVRON_SIZE = 20;
const SWIPE_ACTION_WIDTH = 80;

export default function MessagesScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useSession();
  const [conversations, setConversations] = useState<ConversationWithPeer[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setConversations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getConversations(user.id);
      setConversations(list);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = useCallback(async (conv: ConversationWithPeer) => {
    const result = await deleteConversation(conv.id);
    if (result.success) {
      setConversations((prev) => prev.filter((c) => c.id !== conv.id));
    }
  }, []);

  const renderRightActions = useCallback(
    (
      progress: Animated.AnimatedInterpolation<number>,
      _dragX: Animated.AnimatedInterpolation<number>,
      swipeable: Swipeable,
      conv: ConversationWithPeer
    ) => {
      const trans = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [SWIPE_ACTION_WIDTH, 0],
      });
      return (
        <Animated.View style={[styles.swipeActionWrap, { transform: [{ translateX: trans }] }]}>
          <RectButton
            style={[styles.swipeDeleteBtn, { backgroundColor: colors.destructive }]}
            onPress={() => {
              swipeable.close();
              handleDelete(conv);
            }}
          >
            <Ionicons name="trash-outline" size={22} color="#fff" />
            <Text style={styles.swipeDeleteText}>Delete</Text>
          </RectButton>
        </Animated.View>
      );
    },
    [colors.destructive, handleDelete]
  );

  const renderItem: ListRenderItem<ConversationWithPeer> = useCallback(
    ({ item }) => (
      <Swipeable
        renderRightActions={(progress, dragX, s) => renderRightActions(progress, dragX, s, item)}
        friction={2}
        rightThreshold={40}
      >
          <Pressable
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
            onPress={() => router.push(`/messages/${item.id}`)}
          >
            <ProAvatar
              avatarUrl={item.peerAvatarUrl}
              isPro={item.peerIsPro}
              size="medium"
              placeholderLetter={item.peerName || '?'}
              style={styles.avatarWrap}
            />
            <View style={styles.content}>
              <NameWithVerified name={item.peerName || 'Unknown'} isPro={item.peerIsPro} />
              <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.lastMessageBody || 'No messages yet'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={CHEVRON_SIZE} color={colors.textSecondary} />
          </Pressable>
        </Swipeable>
    ),
    [colors, router, renderRightActions]
  );

  if (!user) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Sign in to view messages.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, conversations.length === 0 && styles.listEmpty]}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No conversations yet. Open a saved contact and tap Message to start.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Layout.cardPadding },
  listContent: { padding: Layout.screenPadding, paddingBottom: 40 },
  listEmpty: { flex: 1, justifyContent: 'center', paddingVertical: 40 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Layout.screenPadding,
    marginBottom: 8,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
  },
  avatarWrap: { marginRight: 12 },
  content: { flex: 1, minWidth: 0 },
  preview: { fontSize: 14, marginTop: 2 },
  emptyText: { textAlign: 'center', fontSize: 15 },
  swipeActionWrap: {
    width: SWIPE_ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDeleteBtn: {
    flex: 1,
    width: SWIPE_ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeDeleteText: { color: '#fff', fontSize: 12, marginTop: 2 },
});
