import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PRO_UPGRADE_FEATURE_ITEMS } from '@/constants/proUpgradeFeatures';
import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * Shared bullet list for full-screen Pro gates (Map, Analytics, etc.).
 */
export function ProGateFeatureList() {
  const colors = useThemeColors();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: colors.text }]}>What you get with Pro</Text>
      <View style={styles.list}>
        {PRO_UPGRADE_FEATURE_ITEMS.map((item) => (
          <View key={item.text} style={styles.row}>
            <Ionicons
              name={item.icon as ComponentProps<typeof Ionicons>['name']}
              size={18}
              color={colors.accent}
              style={styles.rowIcon}
            />
            <Text style={[styles.rowText, { color: colors.text }]}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginBottom: Layout.sectionGap },
  heading: {
    fontSize: Layout.bodySmall + 1,
    fontWeight: '700',
    marginBottom: Layout.rowGap,
    textAlign: 'center',
  },
  list: { gap: 10, width: '100%' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rowIcon: { marginTop: 2 },
  rowText: { flex: 1, fontSize: Layout.bodySmall + 1, lineHeight: 22 },
});
