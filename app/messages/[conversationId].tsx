import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  ListRenderItem,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProAvatar, PRO_RING_COLOR } from '@/components/ProBadge';
import { Layout } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { getConversation, getMessages, getProfile, getSubscription, sendMessage, type Message } from '@/lib/api';

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const { profile: myProfile } = useProfile();
  const { isPro: myIsPro } = useSubscription();
  const [messages, setMessages] = useState<Message[]>([]);
  const [peerAvatarUrl, setPeerAvatarUrl] = useState<string | null>(null);
  const [peerIsPro, setPeerIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const myAvatarUrl = myProfile?.avatarUrl?.trim() || null;

  const loadMessages = useCallback(async () => {
    if (!conversationId || !user?.id) return;
    setLoading(true);
    try {
      const [conv, list] = await Promise.all([
        getConversation(conversationId),
        getMessages(conversationId),
      ]);
      setMessages(list ?? []);
      if (conv) {
        const peerId = conv.user1Id === user.id ? conv.user2Id : conv.user1Id;
        const [peerProfile, peerSub] = await Promise.all([
          getProfile(peerId),
          getSubscription(peerId),
        ]);
        setPeerAvatarUrl(peerProfile?.avatarUrl?.trim() || null);
        setPeerIsPro((peerSub?.plan as string) === 'pro');
      }
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user?.id]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!user?.id || !conversationId || !trimmed || sending) return;
    setSending(true);
    setInput('');
    try {
      const msg = await sendMessage(conversationId, user.id, trimmed);
      if (msg) setMessages((prev) => [...prev, msg]);
    } finally {
      setSending(false);
    }
  }, [user?.id, conversationId, input, sending]);

  const formatMessageTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const dateStr = isToday
      ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    return dateStr;
  };

  const renderItem: ListRenderItem<Message> = useCallback(
    ({ item }) => {
      const isMe = item.senderId === user?.id;
      const avatarUrl = isMe ? myAvatarUrl : peerAvatarUrl;
      const showPro = isMe ? myIsPro : peerIsPro;
      const renderProBadge = () =>
        showPro ? (
          <View style={styles.verifiedWrap}>
            <Ionicons name="checkmark-circle" size={18} color={PRO_RING_COLOR} />
          </View>
        ) : null;
      return (
        <View style={[styles.bubbleRow, isMe ? styles.bubbleRowMe : styles.bubbleRowThem]}>
          {!isMe && (
            <>
              <ProAvatar avatarUrl={avatarUrl} isPro={showPro} size="small" style={styles.chatAvatarWrap} />
              {renderProBadge()}
            </>
          )}
          <View style={[styles.bubbleWithTime, isMe ? styles.bubbleWithTimeMe : styles.bubbleWithTimeThem]}>
            <View
              style={[
                styles.bubble,
                isMe ? { backgroundColor: colors.accent } : { backgroundColor: colors.surface, borderColor: colors.borderLight },
              ]}
            >
              <Text style={[styles.bubbleText, { color: isMe ? colors.primary : colors.text }]}>{item.body}</Text>
            </View>
            <Text style={[styles.bubbleTime, { color: colors.textSecondary }]}>
              {formatMessageTime(item.createdAt)}
            </Text>
          </View>
          {isMe && (
            <>
              {renderProBadge()}
              <ProAvatar avatarUrl={avatarUrl} isPro={showPro} size="small" style={styles.chatAvatarWrap} />
            </>
          )}
        </View>
      );
    },
    [colors, myAvatarUrl, myIsPro, peerAvatarUrl, peerIsPro, user?.id]
  );

  if (!conversationId || !user) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Invalid conversation.</Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: colors.borderLight }]}>
          <Text style={{ color: colors.text }}>Go back</Text>
        </Pressable>
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
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 60 }]}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary, marginTop: 24 }]}>
            No messages yet. Say hi!
          </Text>
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={[styles.inputRow, { paddingBottom: insets.bottom + 8, borderTopColor: colors.borderLight }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.borderLight }]}
          placeholder="Message..."
          placeholderTextColor={colors.textSecondary}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={2000}
          editable={!sending}
        />
        <Pressable
          onPress={handleSend}
          disabled={!input.trim() || sending}
          style={[
            styles.sendBtn,
            { backgroundColor: colors.accent },
            (!input.trim() || sending) && { opacity: 0.5 },
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Ionicons name="send" size={22} color={colors.background} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Layout.cardPadding },
  listContent: { padding: Layout.screenPadding, paddingTop: 12 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleRowThem: { justifyContent: 'flex-start' },
  chatAvatarWrap: { marginHorizontal: 6 },
  verifiedWrap: { justifyContent: 'center', marginHorizontal: 2 },
  bubbleWithTime: { maxWidth: '75%' },
  bubbleWithTimeMe: { alignItems: 'flex-end' },
  bubbleWithTimeThem: { alignItems: 'flex-start' },
  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  bubbleText: { fontSize: 16 },
  bubbleTime: { fontSize: 11, marginTop: 2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { textAlign: 'center', fontSize: 15 },
  backBtn: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderRadius: Layout.radiusMd },
});
