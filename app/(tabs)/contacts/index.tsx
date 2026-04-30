import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    ListRenderItem,
    Platform,
    Pressable,
    SectionList,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProAvatar } from '@/components/ProBadge';
import { Layout } from '@/constants/theme';
import { usePresentRevenueCatPaywall } from '@/hooks/usePresentRevenueCatPaywall';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { SavedContact, ScannedContact } from '@/lib/api';
import {
    deleteSavedContact,
    deleteScannedContact,
    getProfile,
    getSavedContacts, getScannedContactDisplayName, getScannedContacts,
    getSubscription,
    syncToCrm
} from '@/lib/api';
import { syncContactsToPhone } from '@/utils/syncContactsToPhone';

const ROW_GAP = 12;

function formatMetAt(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function followUpNeedsAttention(iso: string | null): boolean {
  if (!iso?.trim()) return false;
  try {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return false;
    const days = (t - Date.now()) / 86400000;
    return days <= 7;
  } catch {
    return false;
  }
}

export default function ContactsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const { user, session } = useSession();
  const { isPro } = useSubscription();
  const { presentPaywall } = usePresentRevenueCatPaywall();
  const [contacts, setContacts] = useState<SavedContact[]>([]);
  const [scannedContacts, setScannedContacts] = useState<ScannedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingCrm, setSyncingCrm] = useState(false);
  const [avatarByUserId, setAvatarByUserId] = useState<Record<string, string | null>>({});
  const [nameByUserId, setNameByUserId] = useState<Record<string, string>>({});
  const [isProByUserId, setIsProByUserId] = useState<Record<string, boolean>>({});

  const isPlaceholderScanned = useCallback((c: ScannedContact) => {
    return (
      (c.name?.toLowerCase() === 'john smith' && c.email?.toLowerCase() === 'john.smith@acme.com') ||
      (c.company?.toLowerCase() === 'acme corp' && c.email?.toLowerCase() === 'john.smith@acme.com')
    );
  }, []);

  const loadContacts = useCallback(async () => {
    if (!user) {
      setContacts([]);
      setScannedContacts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [list, scanned] = await Promise.all([
        getSavedContacts(),
        getScannedContacts(user.id),
      ]);
      setContacts(list ?? []);
      setScannedContacts((scanned ?? []).filter((c) => !isPlaceholderScanned(c)));
      setAvatarByUserId({});
      setNameByUserId({});
      setIsProByUserId({});
      if (list?.length) {
        const avatarMap: Record<string, string | null> = {};
        const nameMap: Record<string, string> = {};
        const proMap: Record<string, boolean> = {};
        await Promise.all(
          list.map(async (c) => {
            const needsAvatar = !c.avatarUrl?.trim();
            const needsName = !c.displayName?.trim();
            if (needsAvatar || needsName) {
              try {
                const profile = await getProfile(c.contactUserId);
                if (needsAvatar) avatarMap[c.contactUserId] = profile?.avatarUrl?.trim() ?? null;
                if (needsName && profile?.name?.trim()) nameMap[c.contactUserId] = profile.name.trim();
              } catch {
                if (needsAvatar) avatarMap[c.contactUserId] = null;
              }
            } else if (c.avatarUrl?.trim()) {
              avatarMap[c.contactUserId] = c.avatarUrl.trim();
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
        setNameByUserId((prev) => ({ ...prev, ...nameMap }));
        setIsProByUserId((prev) => ({ ...prev, ...proMap }));
      }
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, isPlaceholderScanned]);

  useFocusEffect(
    useCallback(() => {
      if (user) loadContacts();
    }, [user, loadContacts])
  );

  const handleSyncToPhone = useCallback(async () => {
    if (!isPro) {
      Alert.alert(
        'Pro feature',
        'Sync to Phone is a Pro feature. Upgrade to sync your contacts to your phone.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => void presentPaywall() },
        ]
      );
      return;
    }
    if (contacts.length === 0 && scannedContacts.length === 0) {
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
  }, [contacts, scannedContacts.length, isPro, presentPaywall]);

  const handleSyncToCrm = useCallback(async () => {
    if (!isPro) {
      Alert.alert(
        'Pro feature',
        'Sync to CRM is a Pro feature. Upgrade to sync your contacts to HubSpot.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => void presentPaywall() },
        ]
      );
      return;
    }
    if (contacts.length === 0 && scannedContacts.length === 0) {
      Alert.alert('No contacts', 'Add contacts first, then sync to your CRM.');
      return;
    }
    setSyncingCrm(true);
    try {
      const result = await syncToCrm(session?.access_token);
      if (result.error) {
        Alert.alert('Sync failed', result.error);
      } else if (result.created > 0 || result.skipped > 0) {
        const msg =
          result.failed > 0
            ? `Added ${result.created} to HubSpot. ${result.skipped} already existed. ${result.failed} failed.`
            : `Added ${result.created} contact${result.created !== 1 ? 's' : ''} to HubSpot. ${result.skipped} already existed.`;
        Alert.alert('Synced', msg);
      } else if (result.failed > 0) {
        Alert.alert('Sync failed', 'Could not sync contacts. Make sure HubSpot is connected in Settings → Integrations.');
      } else {
        Alert.alert('No new contacts', 'All your contacts already exist in HubSpot.');
      }
    } catch {
      Alert.alert('Error', 'Could not sync to CRM.');
    } finally {
      setSyncingCrm(false);
    }
  }, [contacts.length, scannedContacts.length, isPro, presentPaywall, session?.access_token]);

  const handleDeleteScanned = useCallback((scanned: ScannedContact) => {
    Alert.alert(
      'Remove scanned contact',
      `Remove ${getScannedContactDisplayName(scanned)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteScannedContact(scanned.id);
            if (ok) setScannedContacts((prev) => prev.filter((c) => c.id !== scanned.id));
          },
        },
      ]
    );
  }, []);

  const handleDelete = useCallback((contact: SavedContact, resolvedName?: string) => {
    Alert.alert(
      'Remove contact',
      `Remove ${resolvedName || contact.displayName || 'this contact'} from your list?`,
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
      const avatarUrl = avatarByUserId[item.contactUserId] ?? item.avatarUrl?.trim() ?? null;
      const isPro = isProByUserId[item.contactUserId] ?? false;
      const displayName = nameByUserId[item.contactUserId] || item.displayName?.trim() || 'Unknown';
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
          onLongPress={() => handleDelete(item, displayName)}
        >
          <ProAvatar
            avatarUrl={avatarUrl}
            size="medium"
            isPro={isPro}
            placeholderLetter={displayName.charAt(0)}
          />
          <View style={styles.contactBox}>
            <View style={styles.contactNameWrap}>
              <Text
                style={[styles.contactName, { color: colors.text }]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              {(item.howMet || item.metAtLocation || item.metAt) ? (
                <Text
                  style={[styles.metAt, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {[item.howMet, item.metAtLocation, item.metAt ? formatMetAt(item.metAt) : null]
                    .filter(Boolean)
                    .join(' • ')}
                </Text>
              ) : null}
            </View>
            {followUpNeedsAttention(item.followUpAt) ? (
              <Ionicons name="alarm-outline" size={22} color={colors.accent} style={{ marginRight: 4 }} />
            ) : null}
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textSecondary}
            />
          </View>
        </Pressable>
      );
    },
    [avatarByUserId, nameByUserId, isProByUserId, colors, router, handleDelete]
  );

  const renderScannedItem: ListRenderItem<ScannedContact> = useCallback(
    ({ item }) => {
      const displayName = getScannedContactDisplayName(item);
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
          onPress={() => router.push(`/(tabs)/contacts/scanned/${item.id}` as const)}
          onLongPress={() => handleDeleteScanned(item)}
        >
          <View style={[styles.scannedAvatar, { backgroundColor: colors.accent + '33' }]}>
            <Ionicons name="document-text-outline" size={22} color={colors.accent} />
          </View>
          <View style={styles.contactBox}>
            <View style={styles.contactNameWrap}>
              <Text style={[styles.contactName, { color: colors.text }]} numberOfLines={1}>
                {displayName}
              </Text>
              {(item.company || item.phone) ? (
                <Text style={[styles.metAt, { color: colors.textSecondary }]} numberOfLines={1}>
                  {[item.company, item.phone].filter(Boolean).join(' • ')}
                </Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </Pressable>
      );
    },
    [colors, handleDeleteScanned, router]
  );

  if (loading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Image
          source={require('@/assets/images/loading.gif')}
          style={{ width: 64, height: 64 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + Layout.screenPadding, paddingBottom: insets.bottom + Layout.tabBarHeight + Layout.sectionGap }]}>
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
            size={22}
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
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>

      {(contacts.length > 0 || scannedContacts.length > 0) && (
        <View style={styles.syncRow}>
          <Pressable
            style={({ pressed }) => [
              styles.syncButton,
              styles.syncButtonHalf,
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
              <Image source={require('@/assets/images/loading.gif')} style={{ width: 24, height: 24 }} />
            ) : (
              <Ionicons name="phone-portrait-outline" size={18} color={colors.accent} />
            )}
            <Text style={[styles.syncButtonText, { color: colors.text }]} numberOfLines={1}>
              {syncing ? 'Syncing…' : 'Sync to Phone'}
            </Text>
            {!isPro && (
              <View style={[styles.proBadge, { backgroundColor: colors.accent + '33' }]}>
                <Text style={[styles.proBadgeText, { color: colors.accent }]}>Pro</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.syncButton,
              styles.syncButtonHalf,
              {
                backgroundColor: colors.surfaceElevated ?? colors.surface,
                borderColor: colors.border,
                opacity: pressed || syncingCrm ? 0.9 : 1,
              },
            ]}
            onPress={handleSyncToCrm}
            disabled={syncingCrm}
          >
            {syncingCrm ? (
              <Image source={require('@/assets/images/loading.gif')} style={{ width: 24, height: 24 }} />
            ) : (
              <Ionicons name="business-outline" size={18} color={colors.accent} />
            )}
            <Text style={[styles.syncButtonText, { color: colors.text }]} numberOfLines={1}>
              {syncingCrm ? 'Syncing…' : 'Sync to CRM'}
            </Text>
            {!isPro && (
              <View style={[styles.proBadge, { backgroundColor: colors.accent + '33' }]}>
                <Text style={[styles.proBadgeText, { color: colors.accent }]}>Pro</Text>
              </View>
            )}
          </Pressable>
        </View>
      )}

      <SectionList
        sections={[
          { title: 'RingTap contacts', data: contacts, key: 'saved' },
          { title: 'Scanned cards', data: scannedContacts, key: 'scanned' },
        ].filter((s) => s.data.length > 0)}
        keyExtractor={(item) => (item as SavedContact & ScannedContact).id}
        renderItem={({ item, section, index }) =>
          section.key === 'scanned'
            ? renderScannedItem({ item: item as ScannedContact, index })
            : renderContactItem({ item: item as SavedContact, index })
        }
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          contacts.length === 0 && scannedContacts.length === 0 && styles.listEmpty,
          { paddingBottom: insets.bottom + Layout.tabBarHeight + Layout.sectionGap },
        ]}
        ItemSeparatorComponent={() => <View style={{ height: ROW_GAP }} />}
        SectionSeparatorComponent={() => <View style={{ height: 20 }} />}
        renderSectionHeader={({ section }) =>
          section.data.length > 0 ? (
            <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
              {section.title}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No contacts yet. Scan a business card or open a profile and tap &quot;Save Contact&quot;.
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
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: Layout.screenPadding,
    marginTop: 10,
    marginBottom: 12,
    borderRadius: Layout.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  messagesIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  messagesTextWrap: { flex: 1 },
  messagesLabel: { fontSize: 15, fontWeight: '600', letterSpacing: 0.2 },
  messagesSubtext: { fontSize: 12, marginTop: 1, opacity: 0.85 },
  syncRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: Layout.screenPadding,
    marginBottom: 12,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Layout.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  syncButtonHalf: {
    flex: 1,
  },
  syncButtonText: { fontSize: 15, fontWeight: '600' },
  proBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadgeText: { fontSize: 11, fontWeight: '700' },
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
  contactNameWrap: { flex: 1, minWidth: 0 },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  metAt: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  scannedAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: { textAlign: 'center', fontSize: 16, lineHeight: 24 },
});
