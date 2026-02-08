import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ProAvatar, NameWithVerified } from '@/components/ProBadge';
import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSession } from '@/hooks/useSession';
import { getSavedContacts, getProfile, getSubscription, deleteSavedContact } from '@/lib/api';
import type { SavedContact } from '@/lib/api';

export default function ContactsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useSession();
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarByUserId, setAvatarByUserId] = useState<Record<string, string | null>>({});
  const [isProByUserId, setIsProByUserId] = useState<Record<string, boolean>>({});

  const loadContacts = useCallback(async () => {
    if (!user) {
      setContacts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getSavedContacts();
      setContacts(list ?? []);
      setAvatarByUserId({});
      setIsProByUserId({});
      if (list?.length) {
        const avatarMap: Record<string, string | null> = {};
        const proMap: Record<string, boolean> = {};
        await Promise.all(
          list.map(async (c) => {
            const url = c.avatarUrl?.trim();
            if (url) avatarMap[c.contactUserId] = url;
            else {
              try {
                const profile = await getProfile(c.contactUserId);
                avatarMap[c.contactUserId] = profile?.avatarUrl?.trim() ?? null;
              } catch {
                avatarMap[c.contactUserId] = null;
              }
            }
            try {
              const sub = await getSubscription(c.contactUserId);
              proMap[c.contactUserId] = (sub?.plan as string) === 'pro';
            } catch {
              proMap[c.contactUserId] = false;
            }
          })
        );
        setAvatarByUserId((prev) => ({ ...prev, ...avatarMap }));
        setIsProByUserId((prev) => ({ ...prev, ...proMap }));
      }
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useFocusEffect(
    useCallback(() => {
      if (user) loadContacts();
    }, [user, loadContacts])
  );

  const handleDelete = useCallback((contact: SavedContact) => {
    Alert.alert(
      'Remove contact',
      `Remove ${contact.displayName || 'this contact'} from your list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteSavedContact(contact.id);
            if (ok) setContacts((prev) => prev.filter((c) => c.id !== contact.id));
          },
        },
      ]
    );
  }, []);

  const renderItem: ListRenderItem<SavedContact> = useCallback(
    ({ item }) => {
      const avatarUrl = item.avatarUrl?.trim() || avatarByUserId[item.contactUserId] || null;
      const isPro = isProByUserId[item.contactUserId] ?? false;
      const name = item.displayName || 'Saved contact';
      return (
        <Pressable
          style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
          onPress={() => router.push(`/profile/${item.contactUserId}` as const)}
        >
          <ProAvatar
            avatarUrl={avatarUrl}
            isPro={isPro}
            size="medium"
            placeholderLetter={name}
            style={styles.avatarWrap}
          />
          <NameWithVerified name={name} isPro={isPro} containerStyle={styles.nameWrap} />
          <Pressable
            onPress={() => handleDelete(item)}
            hitSlop={12}
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
          >
            <Ionicons name="trash-outline" size={ROW_ICON_SIZE} color={colors.textSecondary} />
          </Pressable>
        </Pressable>
      );
    },
    [colors, avatarByUserId, isProByUserId, handleDelete, router]
  );

  if (!user) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Sign in to see your saved contacts.
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
      <Pressable
        style={[styles.messagesRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
        onPress={() => router.push('/messages')}
      >
        <View style={[styles.messagesIconWrap, { backgroundColor: colors.accent + '33' }]}>
          <Ionicons name="chatbubbles-outline" size={ROW_ICON_SIZE + 4} color={colors.accent} />
        </View>
        <Text style={[styles.messagesLabel, { color: colors.text }]}>Messages</Text>
        <Ionicons name="chevron-forward" size={ROW_CHEVRON_SIZE} color={colors.textSecondary} />
      </Pressable>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, contacts.length === 0 && styles.listEmpty]}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No saved contacts yet. Open a profile and tap "Save Contact" to add one.
          </Text>
        }
      />
    </View>
  );
}

const ROW_ICON_SIZE = 22;
const ROW_CHEVRON_SIZE = 20;

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Layout.cardPadding },
  listContent: { paddingHorizontal: Layout.screenPadding, paddingBottom: 40 },
  listEmpty: { flex: 1, justifyContent: 'center', paddingVertical: 40 },
  messagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Layout.screenPadding,
    marginHorizontal: Layout.screenPadding,
    marginTop: Layout.screenPadding,
    marginBottom: 8,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
  },
  messagesIconWrap: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  messagesLabel: { flex: 1, fontSize: 17, fontWeight: '600' },
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
  nameWrap: { flex: 1 },
  deleteBtn: { padding: 8 },
  emptyText: { textAlign: 'center', fontSize: 15 },
});
