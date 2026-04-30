import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useRef, useState } from 'react';
import { Alert, InteractionManager, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getProfileUrlQr } from '@/lib/api';

const QR_SIZE = 280;
/** Keep logo smaller than default 20% so modules stay recoverable with center image. */
const LOGO_SIZE = 48;

/** Use dark color for QR foreground so it scans reliably; fallback to black if too light. */
function qrForegroundColor(hex: string | undefined): string {
  if (!hex || !hex.startsWith('#')) return '#000000';
  let h = hex.slice(1);
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (h.length !== 6) return '#000000';
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  if ([r, g, b].some((n) => Number.isNaN(n))) return '#000000';
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance < 0.6 ? `#${h}` : '#000000';
}

export default function QRShareScreen() {
  const colors = useThemeColors();
  const { profile } = useProfile();
  const { isPro } = useSubscription();
  const [saving, setSaving] = useState(false);
  const qrRef = useRef<View>(null);
  const profileUrl = profile?.username ? getProfileUrlQr(profile.username) : null;

  const saveQR = useCallback(async () => {
    if (!profileUrl) {
      Alert.alert('Set username', 'Add a username in Profile first to get your link.');
      return;
    }
    setSaving(true);
    try {
      const hasLogo = !!(isPro && profile?.avatarUrl?.trim());
      if (hasLogo) {
        await new Promise<void>((resolve) => {
          InteractionManager.runAfterInteractions(() => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          });
        });
      }
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
        width: 320,
        height: 320,
      });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share QR code',
        });
      } else {
        Alert.alert('Saved', 'QR image saved. Use your gallery to share.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not save or share QR image.');
    } finally {
      setSaving(false);
    }
  }, [profileUrl, isPro, profile?.avatarUrl]);

  if (!profileUrl) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.empty}>
          <Ionicons name="qr-code-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Set a username in Profile to get your link and QR code.</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        <View style={styles.centered}>
          <View ref={qrRef} collapsable={false} style={[styles.qrWrap, { backgroundColor: colors.surface }]}>
            <QRCode
              value={profileUrl}
              size={QR_SIZE}
              backgroundColor="#FFFFFF"
              color={isPro ? qrForegroundColor(profile?.theme?.accentColor ?? profile?.theme?.profileBorderColor) : '#000000'}
              logo={isPro && profile?.avatarUrl?.trim() ? { uri: profile.avatarUrl.trim() } : undefined}
              logoSize={isPro && profile?.avatarUrl ? LOGO_SIZE : undefined}
              logoBackgroundColor="#FFFFFF"
              logoMargin={2}
              logoBorderRadius={LOGO_SIZE / 2}
              quietZone={8}
              ecl={isPro && profile?.avatarUrl?.trim() ? 'H' : 'Q'}
            />
          </View>
          <Text style={[styles.url, { color: colors.textSecondary }]} numberOfLines={2}>
            {profileUrl}
          </Text>
        </View>

        <Pressable
          style={[styles.button, { backgroundColor: colors.accent }, saving && styles.buttonDisabled]}
          onPress={saveQR}
          disabled={saving}
        >
          <Ionicons name="share-outline" size={22} color={colors.onAccent} />
          <Text style={[styles.buttonText, { color: colors.onAccent }]}>
            {saving ? 'Preparing…' : 'Save & share QR image'}
          </Text>
        </Pressable>

        <View style={styles.secondaryButtonWrap}>
          <Link href="/share/nfc" asChild>
            <Pressable style={[styles.secondaryButton, { borderColor: colors.accent }]}>
              <View style={styles.buttonContent}>
                <Ionicons name="phone-portrait-outline" size={22} color={colors.accent} />
                <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>Share with NFC</Text>
              </View>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Layout.screenPadding, paddingBottom: Layout.screenPaddingBottom, alignItems: 'center' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.screenPaddingBottom,
  },
  emptyText: { fontSize: Layout.body, textAlign: 'center' },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Layout.sectionGap,
    marginBottom: Layout.sectionGap,
  },
  qrWrap: {
    padding: 20,
    borderRadius: Layout.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
  },
  url: { fontSize: Layout.caption, marginTop: 20, textAlign: 'center', paddingHorizontal: Layout.screenPadding },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.inputGap,
    width: '100%',
    height: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  secondaryButtonWrap: {
    alignItems: 'center',
    marginTop: Layout.rowGap,
  },
  secondaryButton: {
    height: Layout.buttonHeight,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderRadius: Layout.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.inputGap,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '600' },
});
