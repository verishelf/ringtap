import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HeaderBackButton } from '@/components/HeaderBackButton';
import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useSession } from '@/hooks/useSession';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getSupportUserId } from '@/lib/support';

const SUPPORT_EMAIL = 'hello@ringtap.me';
const FAQ_URL = 'https://www.ringtap.me';

function buildFeedbackMailto(user: { id?: string; email?: string | null } | null): string {
  const version =
    [Constants.expoConfig?.version, Constants.nativeAppVersion].find((v) => typeof v === 'string' && v.length > 0) ?? '—';
  const meta = [
    '---',
    'App: RingTap',
    `Version: ${version}`,
    `Platform: ${Platform.OS}`,
    user?.id ? `User ID: ${user.id}` : null,
    user?.email?.trim() ? `Account email: ${user.email.trim()}` : null,
    '---',
    '',
    'Describe what happened or what you need help with:',
    '',
  ]
    .filter((line): line is string => line != null)
    .join('\n');
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('RingTap — Help / feedback')}&body=${encodeURIComponent(meta)}`;
}

export default function HelpScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const router = useRouter();
  const { user } = useSession();
  const supportUserId = getSupportUserId();
  const canUseSupportChat = !!(supportUserId && user?.id && user.id !== supportUserId);

  const openFaqSite = () => {
    Linking.openURL(FAQ_URL).catch(() => {});
  };

  const openTerms = () => {
    Linking.openURL('https://www.ringtap.me/terms').catch(() => {});
  };

  const openPrivacy = () => {
    Linking.openURL('https://www.ringtap.me/privacy').catch(() => {});
  };

  const openEmail = () => {
    const url = buildFeedbackMailto(user);
    Linking.openURL(url).catch(() => {
      Alert.alert('Email', `Contact us at ${SUPPORT_EMAIL}`);
    });
  };

  const copyEmail = async () => {
    await Clipboard.setStringAsync(SUPPORT_EMAIL);
    Alert.alert('Copied', `${SUPPORT_EMAIL} copied to clipboard.`);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.borderLight, paddingTop: insets.top, paddingBottom: 12 }]}>
        <HeaderBackButton tintColor={colors.text} canGoBack />
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help & feedback</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Layout.screenPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.textSecondary }]}>
          Quick answers below. If something still isn’t right, email us—we read every message.
        </Text>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile & link</Text>
          <Bullet colors={colors} text="Set a username in Profile → Edit so your card is available at ringtap.me/yourname." />
          <Bullet colors={colors} text="Share your link by text or email, or use the QR code from Home (wait for your photo to appear on Pro QR before saving the image)." />
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight, marginTop: Layout.sectionGap }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>NFC & QR</Text>
          <Bullet colors={colors} text="NFC: use Share → NFC or Manage ring to write your profile URL to a supported ring or tag." />
          <Bullet colors={colors} text="QR: recipients can scan with the phone camera—no app required. If a scan fails, try the plain link shown under your QR." />
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight, marginTop: Layout.sectionGap }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Pro & billing</Text>
          <Bullet colors={colors} text="Upgrade or restore purchases from Settings → Subscription. Manage or cancel from the same place or your App Store / Play subscriptions." />
          <Pressable onPress={() => router.push('/(tabs)/settings/pricing')} style={styles.inlineLinkRow}>
            <Text style={[styles.inlineLink, { color: colors.accent }]}>View pricing & features</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.accent} />
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight, marginTop: Layout.sectionGap }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>More on the web</Text>
          <Pressable onPress={openFaqSite} style={styles.row}>
            <Text style={[styles.body, { color: colors.text }]}>RingTap website</Text>
            <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={openTerms} style={styles.row}>
            <Text style={[styles.body, { color: colors.text }]}>Terms of use</Text>
            <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
          </Pressable>
          <Pressable onPress={openPrivacy} style={styles.row}>
            <Text style={[styles.body, { color: colors.text }]}>Privacy policy</Text>
            <Ionicons name="open-outline" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight, marginTop: Layout.sectionGap }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact us</Text>
          <Text style={[styles.body, { color: colors.textSecondary, marginBottom: Layout.rowGap }]}>
            Problems, concerns, or ideas—we read everything.
          </Text>
          {canUseSupportChat ? (
            <>
              <Pressable
                style={[styles.primaryBtn, { backgroundColor: colors.accent, marginBottom: Layout.rowGap }]}
                onPress={() => router.push('/messages/support')}
              >
                <Ionicons name="chatbubbles-outline" size={22} color={colors.onAccent} />
                <Text style={[styles.primaryBtnText, { color: colors.onAccent }]}>Message RingTap in the app</Text>
              </Pressable>
              <Text style={[styles.body, { color: colors.textSecondary, marginBottom: Layout.rowGap }]}>
                Or email (include details and your account email if you can):
              </Text>
            </>
          ) : null}
          <Pressable style={[styles.primaryBtn, { backgroundColor: colors.accent }]} onPress={openEmail}>
            <Ionicons name="mail-outline" size={22} color={colors.onAccent} />
            <Text style={[styles.primaryBtnText, { color: colors.onAccent }]}>Email {SUPPORT_EMAIL}</Text>
          </Pressable>
          <Pressable style={[styles.secondaryBtn, { borderColor: colors.borderLight }]} onPress={copyEmail}>
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Copy email address</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function Bullet({ colors, text }: { colors: { textSecondary: string }; text: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
      <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSpacer: { width: 40, height: 40 },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  scroll: { padding: Layout.screenPadding },
  intro: { fontSize: Layout.body, lineHeight: 22, marginBottom: Layout.sectionGap },
  section: {
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: { fontSize: Layout.titleSection, fontWeight: '600', marginBottom: Layout.rowGap },
  body: { fontSize: Layout.body, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  bullet: { fontSize: Layout.body, lineHeight: 22, marginTop: 1 },
  bulletText: { flex: 1, fontSize: Layout.bodySmall + 1, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  inlineLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    paddingVertical: 8,
  },
  inlineLink: { fontSize: Layout.body, fontWeight: '600' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.inputGap,
    paddingVertical: 14,
    borderRadius: Layout.radiusMd,
    marginBottom: Layout.rowGap,
  },
  primaryBtnText: { fontSize: Layout.body, fontWeight: '700' },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Layout.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
  },
  secondaryBtnText: { fontSize: Layout.body, fontWeight: '600' },
});
