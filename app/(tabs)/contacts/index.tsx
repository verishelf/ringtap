import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ListRenderItem,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProAvatar } from '@/components/ProBadge';
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
import { syncContactsToPhone } from '@/utils/syncContactsToPhone';

const ROW_GAP = 12;

export default function ContactsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useSession();
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
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

  const handleSyncToPhone = useCallback(async () => {
    if (contacts.length === 0) {
      Alert.alert('No contacts', 'Add contacts first, then sync to your phone.');
      return;
    }
    setSyncing(true);
    try {
      const result = await syncContactsToPhone(contacts, { fetchProfileForEmailPhone: true });
      if (result.error) {
        Alert.alert('Permission needed', result.error);
      } else if (result.added > 0 || result.skipped > 0) {
        const msg =
          result.failed > 0
            ? `Added ${result.added} to your phone. ${result.failed} failed.`
            : `Added ${result.added} contact${result.added !== 1 ? 's' : ''} to your phone.`;
        Alert.alert('Synced', msg);
      } else if (result.failed > 0) {
        Alert.alert('Sync failed', 'Could not add contacts. Check permissions.');
      }
    } catch {
      Alert.alert('Error', 'Could not sync contacts.');
    } finally {
      setSyncing(false);
    }
  }, [contacts]);

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
      const displayName = item.displayName || 'Unknown';
      return (
        <Pressable
          style={({ pressed }) => [
            styles.contactRow,
            {
              backgroundColor: colors.surfaceElevated ?? colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.9 : 1,
            },
          ]}
          onPress={() => router.push(`/profile/${item.contactUserId}` as const)}
          onLongPress={() => handleDelete(item)}
        >
          <ProAvatar
            avatarUrl={avatarUrl}
            size="medium"
            isPro={isPro}
            placeholderLetter={displayName.charAt(0)}
          />
          <View style={styles.contactBox}>
            <Text
              style={[styles.contactName, { color: colors.text }]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </View>
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
        style={({ pressed }) => [
          styles.messagesCard,
          {
            backgroundColor: colors.surfaceElevated ?? colors.surface,
            borderColor: colors.border,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        onPress={() => router.push('/messages')}
      >
        <View
          style={[
            styles.messagesIconWrap,
            { backgroundColor: colors.accent + '22' },
          ]}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={26}
            color={colors.accent}
          />
        </View>
        <View style={styles.messagesTextWrap}>
          <Text style={[styles.messagesLabel, { color: colors.text }]}>
            Messages
          </Text>
          <Text style={[styles.messagesSubtext, { color: colors.textSecondary }]}>
            View conversations
          </Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      {contacts.length > 0 && (
        <Pressable
          style={({ pressed }) => [
            styles.syncButton,
            {
              backgroundColor: colors.surfaceElevated ?? colors.surface,
              borderColor: colors.border,
              opacity: pressed || syncing ? 0.9 : 1,
            },
          ]}
          onPress={handleSyncToPhone}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <Ionicons name="phone-portrait-outline" size={22} color={colors.accent} />
          )}
          <Text style={[styles.syncButtonText, { color: colors.text }]}>
            {syncing ? 'Syncing…' : 'Sync to Phone'}
          </Text>
        </Pressable>
      )}

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContactItem}
        contentContainerStyle={[
          styles.listContent,
          contacts.length === 0 && styles.listEmpty,
        ]}
        ItemSeparatorComponent={() => <View style={{ height: ROW_GAP }} />}
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
    paddingVertical: 60,
  },
  messagesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginHorizontal: Layout.screenPadding,
    marginTop: 12,
    marginBottom: 24,
    borderRadius: Layout.radiusXl,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  messagesIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  messagesTextWrap: { flex: 1 },
  messagesLabel: { fontSize: 16, fontWeight: '600', letterSpacing: 0.2 },
  messagesSubtext: { fontSize: 13, marginTop: 2, opacity: 0.85 },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginHorizontal: Layout.screenPadding,
    marginBottom: 24,
    borderRadius: Layout.radiusXl,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 3 },
    }),
  },
  syncButtonText: { fontSize: 16, fontWeight: '600' },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Layout.screenPadding,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: Layout.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  contactBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  contactName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: { textAlign: 'center', fontSize: 16, lineHeight: 24 },
});
