import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';

interface RingModelViewerProps {
  modelUrl: string | null;
}

/**
 * Placeholder ring viewer. Replace with expo-gl + expo-three + three.js GLTFLoader
 * when 3D models are available (e.g. storage/ring-models/*.glb).
 */
export function RingModelViewer({ modelUrl }: RingModelViewerProps) {
  const colors = useThemeColors();

  if (modelUrl) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
        <Text style={[styles.fallbackText, { color: colors.textSecondary }]}>
          3D model: {modelUrl}
        </Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          Install expo-gl and expo-three for GLB viewer
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceElevated }]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.borderLight }]}>
        <Ionicons name="hardware-chip-outline" size={64} color={colors.accent} />
      </View>
      <Text style={[styles.fallbackText, { color: colors.text }]}>NFC Ring</Text>
      <Text style={[styles.hint, { color: colors.textSecondary }]}>Ring model preview</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    borderRadius: Layout.radiusLg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.cardPadding,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.rowGap,
  },
  fallbackText: {
    fontSize: Layout.body,
    fontWeight: '600',
  },
  hint: {
    fontSize: Layout.caption,
    marginTop: 4,
  },
});
