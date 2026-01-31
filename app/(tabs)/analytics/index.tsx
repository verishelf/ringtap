import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getAnalytics } from '@/lib/api';
import type { AnalyticsSummary } from '@/lib/supabase/types';

type Period = 7 | 30 | 90;

export default function AnalyticsScreen() {
  const { profile } = useProfile();
  const { isPro } = useSubscription();
  const colors = useThemeColors();
  const [period, setPeriod] = useState<Period>(30);
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!profile?.id) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await getAnalytics(profile.id, period);
    setData(result);
    setLoading(false);
  }, [profile?.id, period]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!isPro) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.locked}>
          <Ionicons name="lock-closed" size={64} color={colors.textSecondary} />
          <Text style={[styles.lockedTitle, { color: colors.text }]}>Analytics is a Pro feature</Text>
          <Text style={[styles.lockedSubtitle, { color: colors.textSecondary }]}>
            Upgrade to Pro to see profile views, link clicks, NFC taps, and QR scans.
          </Text>
        </View>
      </ThemedView>
    );
  }

  if (loading || !data) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </ThemedView>
    );
  }

  const periods: { value: Period; label: string }[] = [
    { value: 7, label: '7 days' },
    { value: 30, label: '30 days' },
    { value: 90, label: '90 days' },
  ];

  // Build chart data by day
  const dayMap = new Map<string, { profile_view: number; link_click: number; nfc_tap: number; qr_scan: number }>();
  const start = dayjs().subtract(period, 'day');
  for (let i = 0; i < period; i++) {
    const d = start.add(i, 'day').format('YYYY-MM-DD');
    dayMap.set(d, { profile_view: 0, link_click: 0, nfc_tap: 0, qr_scan: 0 });
  }
  for (const item of data.byDay) {
    const entry = dayMap.get(item.date);
    if (entry && item.type in entry) {
      (entry as Record<string, number>)[item.type] = item.count;
    }
  }
  const chartData = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => {
      const total = counts.profile_view + counts.link_click + counts.nfc_tap + counts.qr_scan;
      return {
        date,
        label: dayjs(date).format('M/D'),
        total,
        profile_view: counts.profile_view,
        link_click: counts.link_click,
        nfc_tap: counts.nfc_tap,
        qr_scan: counts.qr_scan,
      };
    });
  const maxTotal = Math.max(1, ...chartData.map((d) => d.total));

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.periodRow}>
          {periods.map(({ value, label }) => (
            <Pressable
              key={value}
              style={[
                styles.periodChip,
                { borderColor: colors.borderLight },
                period === value && { borderColor: colors.accent, backgroundColor: colors.surface },
              ]}
              onPress={() => setPeriod(value)}
            >
              <Text style={[styles.periodChipText, period === value && styles.periodChipTextSelected, { color: period === value ? colors.accent : colors.text }]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.cards}>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="eye-outline" size={28} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.text }]}>{data.profileViews}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Profile views</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="hand-left-outline" size={28} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.text }]}>{data.linkClicks}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Link clicks</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="phone-portrait-outline" size={28} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.text }]}>{data.nfcTaps}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>NFC taps</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="qr-code-outline" size={28} color={colors.accent} />
            <Text style={[styles.statValue, { color: colors.text }]}>{data.qrScans}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>QR scans</Text>
          </View>
        </View>

        {chartData.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Activity (7/30/90 days)</Text>
            <View style={[styles.chartWrap, { backgroundColor: colors.surface }]}>
              {chartData.map((d) => (
                <View key={d.date} style={styles.barRow}>
                  <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{d.label}</Text>
                  <View style={[styles.barTrack, { backgroundColor: colors.borderLight }]}>
                    <View
                      style={[
                        styles.barFill,
                        { width: `${(d.total / maxTotal) * 100}%`, backgroundColor: colors.accent },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barValue, { color: colors.text }]}>{d.total}</Text>
                </View>
              ))}
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Views</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#e91e63' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>Clicks</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#4caf50' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>NFC</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ff9800' }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>QR</Text>
              </View>
            </View>
          </View>
        )}

        {chartData.length === 0 && (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No activity in this period</Text>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Layout.screenPadding, paddingBottom: Layout.screenPaddingBottom },
  periodRow: { flexDirection: 'row', gap: Layout.inputGap, marginBottom: Layout.sectionGap },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Layout.radiusPill,
    borderWidth: 1,
  },
  periodChipText: { fontSize: Layout.bodySmall },
  periodChipTextSelected: { fontWeight: '600' },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.rowGap,
    marginBottom: Layout.sectionGap,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: Layout.radiusMd,
  },
  statValue: { fontSize: 24, fontWeight: '700', marginTop: Layout.tightGap },
  statLabel: { fontSize: Layout.caption, marginTop: 4 },
  chartSection: { marginBottom: Layout.sectionGap },
  chartTitle: { fontSize: Layout.titleSection + 1, fontWeight: '600', marginBottom: Layout.rowGap },
  chartWrap: { borderRadius: Layout.radiusMd, padding: 16 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Layout.inputGap, gap: Layout.inputGap },
  barLabel: { width: 36, fontSize: Layout.caption },
  barTrack: { flex: 1, height: 20, borderRadius: Layout.radiusSm, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: Layout.radiusSm },
  barValue: { width: 28, fontSize: Layout.caption, fontWeight: '600', textAlign: 'right' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: Layout.caption },
  empty: { alignItems: 'center', padding: Layout.screenPaddingBottom },
  emptyText: { fontSize: Layout.body },
  locked: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.screenPaddingBottom,
  },
  lockedTitle: { fontSize: 20, fontWeight: '600', marginTop: 16 },
  lockedSubtitle: { fontSize: Layout.bodySmall, marginTop: Layout.tightGap, textAlign: 'center' },
});
