import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import * as MediaLibrary from 'expo-media-library';
import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { captureRef } from 'react-native-view-shot';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useProfile } from '@/hooks/useProfile';
import { getProfileUrlQr } from '@/lib/api';

const QR_SIZE = 240;

const LOCK_SCREEN_INSTRUCTIONS_IOS = [
  'Long press your Lock Screen',
  'Tap "Customize"',
  'Tap "Lock Screen"',
  'Tap the widget area below the time',
  'Tap "Photos" and choose the saved QR image',
  'Tap "Done"',
];

export default function LockScreenQRScreen() {
  const colors = useThemeColors();
  const { profile } = useProfile();
  const [saving, setSaving] = useState(false);
  const qrRef = useRef<View>(null);
  const profileUrl = profile?.username ? getProfileUrlQr(profile.username) : null;

  const saveQRToPhotos = useCallback(async () => {
    if (!profileUrl) {
      Alert.alert('Set username', 'Add a username in Profile first to get your link.');
      return;
    }
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photo access',
          'Allow access to save your QR code to Photos, then you can add it to your Lock Screen.'
        );
        setSaving(false);
        return;
      }
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
        width: 320,
        height: 320,
      });
      await MediaLibrary.createAssetAsync(uri);
      Alert.alert(
        'Saved to Photos',
        "Your QR code is in your Photos. Add it to your Lock Screen using the steps below.",
        [{ text: 'OK' }]
      );
    } catch (e) {
      Alert.alert('Error', 'Could not save QR code to Photos.');
    } finally {
      setSaving(false);
    }
  }, [profileUrl]);

  if (!profileUrl) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.empty}>
          <Ionicons name="phone-portrait-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Set a username in Profile first. Then your QR code can be saved and added to your Lock Screen.
          </Text>
          <Link href="/(tabs)/profile" asChild>
            <Pressable style={[styles.secondaryButton, { borderColor: colors.accent, marginTop: 16 }]}>
              <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>Open Profile</Text>
            </Pressable>
          </Link>
        </View>
      </ThemedView>
    );
  }

  const isIOS = Platform.OS === 'ios';

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>QR on Lock Screen</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Save your QR code to Photos, then add it as a widget so others can scan it from your Lock Screen.
        </Text>

        <View ref={qrRef} collapsible={false} style={[styles.qrWrap, { backgroundColor: colors.surface }]}>
          <QRCode value={profileUrl} size={QR_SIZE} backgroundColor="#FFFFFF" color="#000000" />
        </View>
        <Text style={[styles.url, { color: colors.textSecondary }]} numberOfLines={2}>
          {profileUrl}
        </Text>

        <Pressable
          style={[styles.button, { backgroundColor: colors.accent }, saving && styles.buttonDisabled]}
          onPress={saveQRToPhotos}
          disabled={saving}
        >
          <Ionicons name="save-outline" size={22} color={colors.text} />
          <Text style={[styles.buttonText, { color: colors.text }]}>
            {saving ? 'Saving…' : 'Save QR to Photos'}
          </Text>
        </Pressable>

        {isIOS && (
          <View style={[styles.instructionsBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={[styles.instructionsTitle, { color: colors.text }]}>Add to Lock Screen</Text>
            {LOCK_SCREEN_INSTRUCTIONS_IOS.map((step, i) => (
              <Text key={i} style={[styles.instructionStep, { color: colors.textSecondary }]}>
                {i + 1}. {step}
              </Text>
            ))}
            <Text style={[styles.instructionHint, { color: colors.textSecondary }]}>
              You can also add a Photo widget on your Home Screen and select this image.
            </Text>
          </View>
        )}

        {!isIOS && (
          <View style={[styles.instructionsBox, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
            <Text style={[styles.instructionsTitle, { color: colors.text }]}>Use your QR</Text>
            <Text style={[styles.instructionStep, { color: colors.textSecondary }]}>
              After saving, open your Gallery and set the image as wallpaper or use a widget app that supports
              showing a photo on the lock screen.
            </Text>
          </View>
        )}

        <View style={styles.secondaryButtonWrap}>
          <Link href="/share/qr" asChild>
            <Pressable style={[styles.secondaryButton, { borderColor: colors.accent }]}>
              <View style={styles.buttonContent}>
                <Ionicons name="qr-code-outline" size={22} color={colors.accent} />
                <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>Share QR instead</Text>
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
  scroll: {
    padding: Layout.screenPadding,
    paddingBottom: Layout.screenPaddingBottom,
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.screenPadding,
  },
  emptyText: { fontSize: Layout.body, textAlign: 'center' },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: Layout.sectionGap,
    paddingHorizontal: 8,
  },
  qrWrap: {
    padding: 16,
    borderRadius: Layout.radiusMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  url: { fontSize: Layout.caption, textAlign: 'center', paddingHorizontal: Layout.screenPadding, marginBottom: Layout.sectionGap },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.inputGap,
    width: '100%',
    height: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
    marginBottom: Layout.sectionGap,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: '600' },
  instructionsBox: {
    width: '100%',
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusMd,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Layout.sectionGap,
  },
  instructionsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  instructionStep: { fontSize: 14, marginBottom: 6, lineHeight: 20 },
  instructionHint: { fontSize: 13, marginTop: 12, fontStyle: 'italic' },
  secondaryButtonWrap: { alignItems: 'center' },
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
