import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Link } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useProfile } from '@/hooks/useProfile';
import { getProfileUrl } from '@/lib/api';

export default function NFCShareScreen() {
  const colors = useThemeColors();
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
      <ScrollView contentContainerStyle={styles.scroll}>
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
            <Text style={[styles.stepNum, { backgroundColor: colors.accent, color: colors.primary }]}>1</Text>
            <Text style={[styles.stepText, { color: colors.text }]}>Make sure your NFC ring or card is set up with your profile URL.</Text>
          </View>
          <View style={styles.step}>
            <Text style={[styles.stepNum, { backgroundColor: colors.accent, color: colors.primary }]}>2</Text>
            <Text style={[styles.stepText, { color: colors.text }]}>Hold your ring or card close to the back of their phone.</Text>
          </View>
          <View style={styles.step}>
            <Text style={[styles.stepNum, { backgroundColor: colors.accent, color: colors.primary }]}>3</Text>
            <Text style={[styles.stepText, { color: colors.text }]}>Their phone will open your RingTap profile link.</Text>
          </View>
        </View>

        {profileUrl && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Your profile link</Text>
            <Text style={[styles.url, { color: colors.accent }]}>{profileUrl}</Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>Write this URL to your NFC tag using your phone's NFC tools or a compatible app.</Text>
          </View>
        )}

        <View style={styles.section}>
          <Pressable style={[styles.button, { backgroundColor: colors.accent }]} onPress={testNFC}>
            <Ionicons name="flash-outline" size={22} color={colors.text} />
            <Text style={[styles.buttonText, { color: colors.text }]}>Test NFC (open link)</Text>
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
  hint: { fontSize: Layout.caption, marginTop: Layout.tightGap },
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
