import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    ListRenderItem,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NameWithVerified, ProAvatar } from '@/components/ProBadge';
import { Layout } from '@/constants/theme';
import { useSession } from '@/hooks/useSession';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { SavedContact } from '@/lib/api';
import {
    deleteSavedContact,
    getProfile,
    getSavedContacts,
    getSubscription,
} from '@/lib/api';

export default function ContactsScreen() {
  const insets = useSafeAreaInsets();
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

  const renderContactItem: ListRenderItem<SavedContact> = useCallback(
    ({ item }) => {
      const avatarUrl = avatarByUserId[item.contactUserId] ?? item.avatarUrl?.trim();
      const isPro = isProByUserId[item.contactUserId] ?? false;
      return (
        <Pressable
          style={[
            styles.row,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderLight,
            },
          ]}
          onPress={() => router.push(`/profile/${item.contactUserId}` as const)}
        >
          <View style={styles.avatarWrap}>
            <ProAvatar
              avatarUrl={avatarUrl}
              size="small"
              isPro={isPro}
              placeholderLetter={item.displayName?.charAt(0)}
            />
          </View>
          <View style={styles.nameWrap}>
            <NameWithVerified
              name={item.displayName || 'Unknown'}
              isPro={isPro}
              nameStyle={[styles.contactName, { color: colors.text }]}
            />
          </View>
          <Pressable
            style={styles.deleteBtn}
            onPress={() => handleDelete(item)}
            hitSlop={12}
          >
            <Ionicons name="trash-outline" size={22} color={colors.destructive} />
          </Pressable>
        </Pressable>
      );
    },
    [avatarByUserId, isProByUserId, colors, router, handleDelete]
  );

  if (loading) {
    return (
      <View style={[styles.centered, { paddingBottom: insets.bottom }]}>
        <Image
          source={require('@/assets/images/loading.gif')}
          style={{ width: 64, height: 64 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + Layout.sectionGap }]}>
      <Pressable
        style={[
          styles.messagesRow,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderLight,
          },
        ]}
        onPress={() => router.push('/messages')}
      >
        <View
          style={[
            styles.messagesIconWrap,
            { backgroundColor: colors.accent + '33' },
          ]}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={ROW_ICON_SIZE + 4}
            color={colors.accent}
          />
        </View>
        <Text style={[styles.messagesLabel, { color: colors.text }]}>
          Messages
        </Text>
        <Ionicons
          name="chevron-forward"
          size={ROW_CHEVRON_SIZE}
          color={colors.textSecondary}
        />
      </Pressable>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContactItem}
        contentContainerStyle={[
          styles.listContent,
          contacts.length === 0 && styles.listEmpty,
        ]}
        ListEmptyComponent={
          <Text
            style={[styles.emptyText, { color: colors.textSecondary }]}
          >
            No saved contacts yet. Open a profile and tap "Save Contact"
            to add one.
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.cardPadding,
  },
  listContent: {
    paddingHorizontal: Layout.screenPadding,
    paddingBottom: 40,
  },
  listEmpty: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  messagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Layout.screenPadding,
    marginHorizontal: Layout.screenPadding,
    marginBottom: 8,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
  },
  messagesIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  messagesLabel: { flex: 1, fontSize: 17, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Layout.screenPadding,
    marginHorizontal: Layout.screenPadding,
    marginBottom: 8,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
  },
  avatarWrap: { marginRight: 12 },
  nameWrap: { flex: 1 },
  contactName: { fontSize: 17, fontWeight: '600' },
  deleteBtn: { padding: 8 },
  emptyText: { textAlign: 'center', fontSize: 15 },
});
