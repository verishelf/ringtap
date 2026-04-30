import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Link } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Colors, Layout } from '@/constants/theme';
import { useAppearance } from '@/contexts/AppearanceContext';
import { useProfile } from '@/hooks/useProfile';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getProfileUrl } from '@/lib/api';

export default function NFCShareScreen() {
  const colors = useThemeColors();
  const { isLight } = useAppearance();
  const { profile } = useProfile();
  const profileUrl = profile?.username ? getProfileUrl(profile.username) : null;

  const testNFC = useCallback(() => {
    if (!profileUrl) {
      Alert.alert('Set username', 'Add a username in Profile first to get your link.');
      return;
    }
    Alert.alert(
      'Test NFC',
      'In a real NFC flow, tapping your ring or card would open this link. Open it now?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open link', onPress: () => Linking.openURL(profileUrl) },
      ]
    );
  }, [profileUrl]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} showsHorizontalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Ionicons name="phone-portrait-outline" size={56} color={colors.accent} />
          <Text style={[styles.title, { color: colors.text }]}>Share with NFC</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Tap your NFC ring or card to someone's phone to share your RingTap profile instantly.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How it works</Text>
          <View style={styles.step}>
            <Text style={[styles.stepNum, { backgroundColor: colors.accent, color: colors.onAccent }]}>1</Text>
            <Text style={[styles.stepText, { color: colors.text }]}>Make sure your NFC ring or card is set up with your profile URL.</Text>
          </View>
          <View style={styles.step}>
            <Text style={[styles.stepNum, { backgroundColor: colors.accent, color: colors.onAccent }]}>2</Text>
            <Text style={[styles.stepText, { color: colors.text }]}>Hold your ring or card close to the back of their phone.</Text>
          </View>
          <View style={styles.step}>
            <Text style={[styles.stepNum, { backgroundColor: colors.accent, color: colors.onAccent }]}>3</Text>
            <Text style={[styles.stepText, { color: colors.text }]}>Their phone will open your RingTap profile link.</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your profile link</Text>
          {profileUrl ? (
            <Text style={[styles.url, { color: colors.accent }]}>{profileUrl}</Text>
          ) : (
            <Text style={[styles.profileLinkPlaceholder, { color: colors.textSecondary }]}>
              Add a username in Profile to get your ringtap.me link.
            </Text>
          )}
          <View style={styles.linkRingWrap}>
            <Link href="/activate" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Link ring"
                android_ripple={
                  Platform.OS === 'android'
                    ? {
                        color: isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.25)',
                        foreground: true,
                      }
                    : undefined
                }
                style={({ pressed }) => [
                  styles.linkRingButton,
                  isLight
                    ? {
                        backgroundColor: colors.surfaceElevated,
                        borderWidth: 2,
                        borderColor: Colors.light.text,
                      }
                    : {
                        backgroundColor: Colors.dark.primary,
                        borderWidth: 0,
                      },
                  pressed && styles.linkRingButtonPressed,
                ]}
              >
                <Ionicons
                  name="ellipse-outline"
                  size={28}
                  color={isLight ? Colors.light.text : Colors.dark.tint}
                />
                <Text
                  style={[
                    styles.linkRingButtonText,
                    { color: isLight ? Colors.light.text : Colors.dark.tint },
                  ]}
                >
                  Link ring
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View style={styles.section}>
          <Pressable style={[styles.button, { backgroundColor: colors.accent }]} onPress={testNFC}>
            <Ionicons name="flash-outline" size={22} color={colors.onAccent} />
            <Text style={[styles.buttonText, { color: colors.onAccent }]}>Test NFC (open link)</Text>
          </Pressable>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>Simulates opening your profile link as if an NFC tap triggered it.</Text>
        </View>

        <View style={styles.secondaryButtonWrap}>
          <Link href="/share/qr" asChild>
            <Pressable style={[styles.secondaryButton, { borderColor: colors.accent }]}>
              <View style={styles.buttonContent}>
                <Ionicons name="qr-code-outline" size={22} color={colors.accent} />
                <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>Share with QR instead</Text>
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
  scroll: { padding: Layout.screenPadding, paddingBottom: Layout.screenPaddingBottom },
  card: {
    alignItems: 'center',
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusLg,
    marginBottom: Layout.sectionGap,
  },
  title: { fontSize: 22, fontWeight: '700', marginTop: 16 },
  subtitle: { fontSize: Layout.bodySmall + 1, marginTop: Layout.tightGap, textAlign: 'center' },
  section: { marginBottom: Layout.sectionGap },
  sectionTitle: { fontSize: Layout.titleSection + 1, fontWeight: '600', marginBottom: Layout.rowGap },
  step: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: Layout.rowGap },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '700',
    fontSize: Layout.bodySmall,
  },
  stepText: { flex: 1, fontSize: Layout.bodySmall + 1, lineHeight: 22 },
  url: { fontSize: Layout.bodySmall, marginBottom: Layout.tightGap },
  profileLinkPlaceholder: { fontSize: Layout.bodySmall, marginBottom: Layout.tightGap, lineHeight: 22 },
  hint: { fontSize: Layout.caption, marginTop: Layout.tightGap },
  linkRingWrap: {
    alignItems: 'center',
    marginTop: Layout.tightGap,
  },
  linkRingButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 148,
    minHeight: Layout.buttonHeight + 8,
    borderRadius: Layout.radiusMd,
  },
  linkRingButtonPressed: { opacity: Platform.OS === 'ios' ? 0.92 : 1 },
  linkRingButtonText: { fontSize: Layout.body, fontWeight: '600', textAlign: 'center' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.inputGap,
    height: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
  },
  buttonText: { fontSize: Layout.body, fontWeight: '600' },
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
