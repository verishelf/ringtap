import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderBackButton } from '@/components/HeaderBackButton';
import { Layout } from '@/constants/theme';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { CrmConnection } from '@/lib/api';
import {
  disconnectCrm,
  getCrmConnectUrl,
  getCrmConnections,
} from '@/lib/api';

const MENU_ICON_SIZE = 22;
const CHEVRON_SIZE = 20;
const ICON_BOX_SIZE = 28;

export default function IntegrationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colors = useThemeColors();
  const { user } = useSession();
  const { isPro } = useSubscription();
  const [connections, setConnections] = useState<CrmConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const loadConnections = useCallback(async () => {
    if (!user) {
      setConnections([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getCrmConnections();
      setConnections(list ?? []);
    } catch {
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadConnections();
    }, [loadConnections])
  );

  const handleConnectHubSpot = useCallback(async () => {
    if (!isPro) {
      Alert.alert(
        'Pro feature',
        'CRM sync is a Pro feature. Upgrade to connect HubSpot and sync your contacts.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/(tabs)/settings/upgrade') },
        ]
      );
      return;
    }
    setConnecting(true);
    try {
      const { url, error } = await getCrmConnectUrl('hubspot');
      if (error || !url) {
        Alert.alert('Error', error ?? 'Could not start HubSpot connection');
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert('Error', 'Could not open HubSpot');
    } finally {
      setConnecting(false);
    }
  }, [isPro, router]);

  const handleDisconnect = useCallback(
    (provider: string) => {
      const name = provider === 'hubspot' ? 'HubSpot' : provider;
      Alert.alert(
        `Disconnect ${name}`,
        `Are you sure you want to disconnect ${name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disconnect',
            style: 'destructive',
            onPress: async () => {
              const { success, error } = await disconnectCrm(provider);
              if (success) {
                setConnections((prev) => prev.filter((c) => c.provider !== provider));
              } else {
                Alert.alert('Error', error ?? 'Could not disconnect');
              }
            },
          },
        ]
      );
    },
    []
  );

  const hasHubSpot = connections.some((c) => c.provider === 'hubspot');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <HeaderBackButton onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Integrations</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom: insets.bottom + Layout.sectionGap,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>CRM</Text>
        <Text style={[styles.hint, { color: colors.textSecondary, marginBottom: 12 }]}>
          Sync your RingTap contacts to your CRM. Pro required.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.row, styles.rowBorder, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.iconBox, { width: ICON_BOX_SIZE, height: ICON_BOX_SIZE }]}>
                <Ionicons name="logo-hubspot" size={MENU_ICON_SIZE} color="#ff7a59" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.menuText, { color: colors.text }]}>HubSpot</Text>
                <Text style={[styles.hint, { color: colors.textSecondary, marginTop: 2 }]}>
                  {hasHubSpot ? 'Connected' : 'Not connected'}
                </Text>
              </View>
            </View>
            {hasHubSpot ? (
              <Pressable
                onPress={() => handleDisconnect('hubspot')}
                style={[styles.disconnectBtn, { borderColor: colors.destructive }]}
              >
                <Text style={[styles.disconnectText, { color: colors.destructive }]}>Disconnect</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleConnectHubSpot}
                disabled={connecting}
                style={[styles.connectBtn, { backgroundColor: colors.accent }]}
              >
                {connecting ? (
                  <Image source={require('@/assets/images/loading.gif')} style={{ width: 20, height: 20 }} />
                ) : (
                  <Text style={[styles.connectText, { color: '#fff' }]}>Connect</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>

        {!isPro && (
          <View style={[styles.proBanner, { backgroundColor: colors.accent + '22', borderColor: colors.accent + '33' }]}>
            <Ionicons name="lock-closed" size={20} color={colors.accent} />
            <Text style={[styles.proBannerText, { color: colors.text }]}>
              Upgrade to Pro to connect HubSpot and sync contacts.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  headerSpacer: { width: 40 },
  scroll: { padding: Layout.screenPadding },
  sectionTitle: { fontSize: Layout.titleSection, fontWeight: '600', marginBottom: 4 },
  hint: { fontSize: Layout.caption },
  card: {
    borderRadius: Layout.radiusXl,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.cardPadding,
    paddingHorizontal: Layout.cardPadding,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  iconBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: { fontSize: Layout.body, flexShrink: 1 },
  connectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectText: { fontSize: 14, fontWeight: '600' },
  disconnectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  disconnectText: { fontSize: 13, fontWeight: '600' },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: Layout.radiusLg,
    borderWidth: 1,
    marginTop: 16,
  },
  proBannerText: { fontSize: 14, flex: 1 },
});
