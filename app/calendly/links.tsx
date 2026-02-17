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
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Layout } from '@/constants/theme';
import { useSession } from '@/hooks/useSession';
import { useThemeColors } from '@/hooks/useThemeColors';
import { isCalendlyConnected } from '@/lib/calendly/calendlyAuth';
import { supabase, supabaseUrl } from '@/lib/supabase/supabaseClient';

type BookingLink = { name: string; url: string; uri: string };

export default function BookingLinksScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useSession();
  const [links, setLinks] = useState<BookingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const fetchLinks = useCallback(async () => {
    if (!user?.id) {
      setLinks([]);
      setLoading(false);
      return;
    }
    const isConnected = await isCalendlyConnected(user.id);
    setConnected(isConnected);
    if (!isConnected) {
      setLinks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setLinks([]);
        return;
      }
      const res = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/calendly-links`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      setLinks(json.links ?? []);
    } catch {
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  useFocusEffect(
    useCallback(() => {
      if (user) fetchLinks();
    }, [user, fetchLinks])
  );

  const handleCopy = async (link: BookingLink) => {
    if (!link.url) return;
    await Clipboard.setStringAsync(link.url);
    Alert.alert('Copied', 'Booking link copied to clipboard');
  };

  const renderItem: ListRenderItem<BookingLink> = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
      <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
        {item.name}
      </Text>
      {item.url ? (
        <Text style={[styles.cardUrl, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.url}
        </Text>
      ) : null}
      <Pressable
        style={[styles.copyBtn, { backgroundColor: colors.accent }]}
        onPress={() => handleCopy(item)}
      >
        <Ionicons name="copy-outline" size={18} color={colors.primary} />
        <Text style={[styles.copyBtnText, { color: colors.primary }]}>Copy</Text>
      </Pressable>
    </View>
  );

  if (!connected) {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom }]}>
        <Ionicons name="link-outline" size={48} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Connect Calendly to see your booking links
        </Text>
        <Pressable
          style={[styles.connectBtn, { backgroundColor: colors.accent }]}
          onPress={() => router.push('/calendly/connect')}
        >
          <Text style={[styles.connectBtnText, { color: colors.primary }]}>Connect Calendly</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + Layout.sectionGap }]}>
      <FlatList
        data={links}
        keyExtractor={(item) => item.uri || item.name}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No event types found. Create one in your Calendly account.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Layout.screenPadding },
  list: { padding: Layout.screenPadding, paddingBottom: Layout.sectionGap },
  card: {
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
    marginBottom: Layout.rowGap,
  },
  cardTitle: { fontSize: Layout.body, fontWeight: '600' },
  cardUrl: { fontSize: Layout.caption, marginTop: 4 },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: Layout.rowGap,
    paddingVertical: 10,
    borderRadius: Layout.radiusMd,
  },
  copyBtnText: { fontSize: Layout.bodySmall, fontWeight: '600' },
  empty: { paddingVertical: Layout.sectionGap * 2 },
  emptyText: { fontSize: Layout.body, textAlign: 'center' },
  connectBtn: {
    marginTop: Layout.sectionGap,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Layout.radiusMd,
  },
  connectBtnText: { fontSize: Layout.body, fontWeight: '600' },
});
