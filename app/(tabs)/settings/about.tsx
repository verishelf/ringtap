import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function AboutScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const openFlaticon = () => {
    Linking.openURL('https://www.flaticon.com/free-icons/verified').catch(() => {});
  };

  const openTerms = () => {
    Linking.openURL('https://www.ringtap.me/terms').catch(() => {});
  };

  const openPrivacy = () => {
    Linking.openURL('https://www.ringtap.me/privacy').catch(() => {});
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
        <Pressable onPress={() => router.back()} style={styles.headerBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>About & attributions</Text>
        <View style={styles.headerBack} />
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: Layout.screenPaddingBottom }]}>
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Legal</Text>
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Attributions</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Verified icons created by{' '}
            <Text style={[styles.link, { color: colors.accent }]} onPress={openFlaticon}>
              QudaDesign - Flaticon
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Layout.screenPadding,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBack: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  scroll: { padding: Layout.screenPadding },
  section: {
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  sectionTitle: { fontSize: Layout.titleSection, fontWeight: '600', marginBottom: Layout.rowGap },
  body: { fontSize: Layout.body, lineHeight: 20 },
  link: { textDecorationLine: 'underline' },
});

