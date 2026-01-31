import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useProfile } from '@/hooks/useProfile';
import { getProfileUrl } from '@/lib/api';

export default function QRShareScreen() {
  const colors = useThemeColors();
  const { profile } = useProfile();
  const [saving, setSaving] = useState(false);
  const qrRef = useRef<View>(null);
  const profileUrl = profile?.username ? getProfileUrl(profile.username) : null;

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
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View ref={qrRef} collapsable={false} style={[styles.qrWrap, { backgroundColor: colors.surface }]}>
            <QRCode value={profileUrl} size={240} backgroundColor="#FFFFFF" color="#000000" />
          </View>
          <Text style={[styles.url, { color: colors.textSecondary }]}>{profileUrl}</Text>
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
  card: {
    alignItems: 'center',
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusLg,
    marginBottom: Layout.sectionGap,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  qrWrap: {
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusMd,
  },
  url: { fontSize: Layout.caption, marginTop: 16, textAlign: 'center' },
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
});
