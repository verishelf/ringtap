import { Ionicons } from '@expo/vector-icons';
import type { Href } from 'expo-router';
import { useRouter, useSegments } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderBackButton } from '@/components/HeaderBackButton';
import { Layout } from '@/constants/theme';
import { usePresentRevenueCatPaywall } from '@/hooks/usePresentRevenueCatPaywall';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  getProfileLeadSettings,
  upsertProfileLeadSettingsFull,
  type ProfileLeadSettings,
} from '@/lib/api';

export default function LeadCaptureSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const segments = useSegments();
  const colors = useThemeColors();
  const { isPro } = useSubscription();
  const { profile } = useProfile();
  const inProfileStack = segments.includes('profile') && segments[segments.length - 1] !== 'index';
  const upgradeHref = (inProfileStack ? '/(tabs)/profile/upgrade' : '/(tabs)/settings/upgrade') as Href;
  const { presentPaywall } = usePresentRevenueCatPaywall(upgradeHref);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ProfileLeadSettings | null>(null);

  const load = useCallback(async () => {
    if (!isPro) {
      setLoading(false);
      setDraft(null);
      return;
    }
    setLoading(true);
    try {
      const s = await getProfileLeadSettings();
      setDraft(
        s ?? {
          userId: '',
          enabled: false,
          headline: 'Request an intro',
          collectCompany: true,
          collectPhone: false,
          collectMessage: true,
          webhookUrl: null,
        }
      );
    } finally {
      setLoading(false);
    }
  }, [isPro]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
    if (!isPro || !draft) return;
    setSaving(true);
    try {
      const { ok, error } = await upsertProfileLeadSettingsFull(draft);
      if (ok) Alert.alert('Saved', 'Your public profile form settings were updated.');
      else Alert.alert('Could not save', error ?? 'Try again.');
    } finally {
      setSaving(false);
    }
  }, [isPro, draft]);

  if (!isPro) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
          <HeaderBackButton onPress={() => router.back()} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Lead capture</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.body, { padding: Layout.screenPadding }]}>
          <View style={[styles.proBanner, { backgroundColor: colors.accent + '22', borderColor: colors.accent + '44' }]}>
            <Ionicons name="mail-outline" size={28} color={colors.accent} />
            <Text style={[styles.proBannerTitle, { color: colors.text }]}>Pro feature</Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Add an inbound lead form to your ringtap.me page, optional HTTPS webhook for Zapier or Make, and count
              submissions in Analytics.
            </Text>
            <Pressable
              style={[styles.upgradeBtn, { backgroundColor: colors.accent }]}
              onPress={() => void presentPaywall()}
            >
              <Text style={[styles.upgradeBtnText, { color: colors.onAccent }]}>Upgrade to Pro</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  if (loading || !draft) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
          <HeaderBackButton onPress={() => router.back()} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Lead capture</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const slug = (profile?.username ?? '').trim().toLowerCase();
  const publicUrl = slug ? `https://ringtap.me/${slug}` : 'Set a username in Profile to get your public link.';

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <HeaderBackButton onPress={() => router.back()} />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Lead capture</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Layout.sectionGap }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          When enabled, visitors see this form on your public page ({publicUrl}). Submissions are stored for you and can
          trigger a webhook.
        </Text>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.label, { color: colors.text }]}>Show form on profile</Text>
            <Switch
              value={draft.enabled}
              onValueChange={(enabled) => setDraft((d) => (d ? { ...d, enabled } : d))}
              trackColor={{ false: colors.borderLight, true: colors.accent }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Form title</Text>
            <TextInput
              value={draft.headline}
              onChangeText={(headline) => setDraft((d) => (d ? { ...d, headline } : d))}
              placeholder="Request an intro"
              placeholderTextColor={colors.textSecondary}
              style={[styles.input, { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.background }]}
            />
          </View>
          <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.label, { color: colors.text }]}>Ask for company</Text>
            <Switch
              value={draft.collectCompany}
              onValueChange={(collectCompany) => setDraft((d) => (d ? { ...d, collectCompany } : d))}
              trackColor={{ false: colors.borderLight, true: colors.accent }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.label, { color: colors.text }]}>Ask for phone</Text>
            <Switch
              value={draft.collectPhone}
              onValueChange={(collectPhone) => setDraft((d) => (d ? { ...d, collectPhone } : d))}
              trackColor={{ false: colors.borderLight, true: colors.accent }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={[styles.label, { color: colors.text }]}>Ask for message</Text>
            <Switch
              value={draft.collectMessage}
              onValueChange={(collectMessage) => setDraft((d) => (d ? { ...d, collectMessage } : d))}
              trackColor={{ false: colors.borderLight, true: colors.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Webhook (optional)</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          HTTPS URL only. We POST JSON with event ringtap.profile_lead — use with Zapier Catch Hook or Make webhook.
        </Text>
        <TextInput
          value={draft.webhookUrl ?? ''}
          onChangeText={(webhookUrl) =>
            setDraft((d) => (d ? { ...d, webhookUrl: webhookUrl.trim() ? webhookUrl : null } : d))
          }
          placeholder="https://hooks.zapier.com/..."
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.inputMultiline, { color: colors.text, borderColor: colors.borderLight, backgroundColor: colors.surface }]}
        />

        <Pressable
          style={[styles.saveBtn, { backgroundColor: colors.accent }, saving && { opacity: 0.7 }]}
          onPress={() => void save()}
          disabled={saving}
        >
          <Text style={[styles.saveBtnText, { color: colors.onAccent }]}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1 },
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
  body: { flex: 1 },
  scroll: { padding: Layout.screenPadding },
  hint: { fontSize: Layout.caption, lineHeight: 20, marginBottom: 12 },
  sectionTitle: { fontSize: Layout.titleSection, fontWeight: '600', marginTop: Layout.sectionGap, marginBottom: 6 },
  card: {
    borderRadius: Layout.radiusXl,
    overflow: 'hidden',
    marginBottom: Layout.sectionGap,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Layout.cardPadding,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  label: { fontSize: Layout.body, flex: 1, marginRight: 12 },
  fieldBlock: { padding: Layout.cardPadding, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(128,128,128,0.2)' },
  fieldLabel: { fontSize: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderRadius: Layout.radiusMd,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: Layout.body,
  },
  inputMultiline: {
    borderWidth: 1,
    borderRadius: Layout.radiusMd,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: Layout.body,
    minHeight: 44,
    marginBottom: Layout.sectionGap,
  },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: Layout.radiusLg,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '600' },
  proBanner: {
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusXl,
    borderWidth: 1,
    gap: 10,
  },
  proBannerTitle: { fontSize: 18, fontWeight: '700' },
  upgradeBtn: { marginTop: 8, paddingVertical: 12, borderRadius: Layout.radiusLg, alignItems: 'center' },
  upgradeBtnText: { fontSize: 16, fontWeight: '600' },
});
