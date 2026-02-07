import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useProfile } from '@/hooks/useProfile';
import { getProfileUrlQr } from '@/lib/api';

const QR_SIZE = 280;

export default function QRShareScreen() {
  const colors = useThemeColors();
  const { profile } = useProfile();
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
  }, [profileUrl]);

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
      >
        <View style={styles.centered}>
          <View ref={qrRef} collapsable={false} style={[styles.qrWrap, { backgroundColor: colors.surface }]}>
            <QRCode value={profileUrl} size={QR_SIZE} backgroundColor="#FFFFFF" color="#000000" />
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
          <Ionicons name="share-outline" size={22} color={colors.text} />
          <Text style={[styles.buttonText, { color: colors.text }]}>
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
