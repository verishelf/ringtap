import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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

import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSession } from '@/hooks/useSession';
import { getSavedContacts, deleteSavedContact, type SavedContact } from '@/lib/api';

export default function ContactsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useSession();
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [loading, setLoading] = useState(true);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getSavedContacts();
      setContacts(list ?? []);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadContacts();
    else {
      setContacts([]);
      setLoading(false);
    }
  }, [user, loadContacts]);

  // Refetch when screen is focused so new saves (e.g. from web "Save to app") appear without restarting
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
    ({ item }) => (
      <Pressable
        style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
        onPress={() => router.push(`/profile/${item.contactUserId}` as const)}
      >
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.borderLight }]}>
            <Ionicons name="person" size={24} color={colors.textSecondary} />
          </View>
        )}
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {item.displayName || 'Saved contact'}
        </Text>
        <Pressable
          onPress={() => handleDelete(item)}
          hitSlop={12}
          style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="trash-outline" size={22} color={colors.textSecondary} />
        </Pressable>
      </Pressable>
    ),
    [colors, handleDelete, router]
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
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, contacts.length === 0 && styles.listEmpty]}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No saved contacts yet. Open a profile and tap “Save Contact” to add one.
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
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  name: { flex: 1, fontSize: 16, fontWeight: '500' },
  deleteBtn: { padding: 8 },
  emptyText: { textAlign: 'center', fontSize: 15 },
});
