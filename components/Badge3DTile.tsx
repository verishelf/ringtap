import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { BadgeWithEarned } from '@/services/badgeService';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  sunrise: 'sunny',
  flame: 'flame',
  zap: 'flash',
  crown: 'trophy',
  refresh: 'refresh',
  radio: 'radio',
  'trending-up': 'trending-up',
  'person-add': 'person-add',
  people: 'people',
  globe: 'globe',
  link: 'link',
  layers: 'layers',
  eye: 'eye',
  star: 'star',
};

function getIcon(name: string): keyof typeof Ionicons.glyphMap {
  return ICON_MAP[name] ?? 'ribbon';
}

/** Lighten (amount>0) or darken (amount<0) hex color. amount in 0-1. */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16) || 0;
  const r = ((num >> 16) & 0xff) + amount * 255;
  const g = ((num >> 8) & 0xff) + amount * 255;
  const b = (num & 0xff) + amount * 255;
  const clamp = (n: number) => Math.round(Math.max(0, Math.min(255, n)));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

export interface Badge3DTileProps {
  badge: BadgeWithEarned;
  size?: number;
  showLabel?: boolean;
  style?: ViewStyle;
}

/** Apple-style 3D badge tile: rounded square, gradient, shadow. */
export function Badge3DTile({ badge, size = 72, showLabel = true, style }: Badge3DTileProps) {
  const colors = useThemeColors();
  const earned = badge.earned;
  const color = earned ? (badge.color ?? '#0a7ea4') : '#6B7280';
  const light = earned ? adjustColor(color, 0.25) : '#9CA3AF';
  const dark = earned ? adjustColor(color, -0.2) : '#4B5563';

  return (
    <View style={[styles.wrap, { width: size + 8, opacity: earned ? 1 : 0.65 }, style]}>
      <View
        style={[
          styles.shadowWrap,
          {
            width: size,
            height: size,
            borderRadius: size * 0.22,
          },
          Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: earned ? 0.35 : 0.2,
              shadowRadius: 8,
            },
            android: {
              elevation: earned ? 6 : 3,
            },
          }),
        ]}
      >
        <LinearGradient
          colors={[light, color, dark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradient,
            {
              width: size,
              height: size,
              borderRadius: size * 0.22,
            },
          ]}
        >
          {/* Inner highlight (top edge) for 3D depth */}
          <LinearGradient
            colors={['rgba(255,255,255,0.35)', 'transparent']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            style={[
              styles.innerHighlight,
              {
                width: size,
                height: size * 0.5,
                borderTopLeftRadius: size * 0.22,
                borderTopRightRadius: size * 0.22,
              },
            ]}
          />
          <View style={[styles.iconWrap, { width: size, height: size }]}>
            <Ionicons
              name={getIcon(badge.icon)}
              size={size * 0.4}
              color={earned ? '#FFFFFF' : '#D1D5DB'}
            />
          </View>
        </LinearGradient>
      </View>
      {showLabel && (
        <Text
          style={[styles.label, { width: size + 8, color: colors.text }]}
          numberOfLines={2}
        >
          {badge.name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: 8,
  },
  shadowWrap: {
    backgroundColor: 'transparent',
  },
  gradient: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  iconWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    color: '#FAFAFA',
  },
});
