import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useThemeColors } from '@/hooks/useThemeColors';

export const PRO_RING_COLOR = '#D4AF37';

export type ProAvatarSize = 'small' | 'medium' | 'large';

const AVATAR_SIZES: Record<ProAvatarSize, { wrap: number; inner: number }> = {
  small: { wrap: 36, inner: 32 },
  medium: { wrap: 52, inner: 48 },
  large: { wrap: 94, inner: 88 },
};

export interface ProAvatarProps {
  avatarUrl: string | null;
  isPro: boolean;
  size?: ProAvatarSize;
  placeholderLetter?: string;
  style?: ViewStyle;
}

export function ProAvatar({ avatarUrl, isPro, size = 'medium', placeholderLetter, style }: ProAvatarProps) {
  const colors = useThemeColors();
  const { wrap, inner } = AVATAR_SIZES[size];
  const radius = inner / 2;
  const wrapRadius = wrap / 2;

  return (
    <View
      style={[
        {
          width: wrap,
          height: wrap,
          borderRadius: wrapRadius,
          justifyContent: 'center',
          alignItems: 'center',
        },
        isPro && { borderWidth: 2, borderColor: PRO_RING_COLOR },
        style,
      ]}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: inner, height: inner, borderRadius: radius }}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            { width: inner, height: inner, borderRadius: radius, backgroundColor: colors.borderLight },
          ]}
        >
          <Text style={[styles.placeholderText, { color: colors.textSecondary }]} numberOfLines={1}>
            {(placeholderLetter || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

export interface NameWithVerifiedProps {
  name: string;
  isPro: boolean;
  numberOfLines?: number;
  nameStyle?: ViewStyle;
  containerStyle?: ViewStyle;
}

export function NameWithVerified({ name, isPro, numberOfLines = 1, nameStyle, containerStyle }: NameWithVerifiedProps) {
  const colors = useThemeColors();
  return (
    <View style={[styles.nameRow, containerStyle]}>
      <Text style={[styles.nameText, { color: colors.text }, nameStyle]} numberOfLines={numberOfLines}>
        {name}
      </Text>
      {isPro ? (
        <Image
          source={require('@/assets/images/verified.png')}
          style={styles.verifiedBadge}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 18, fontWeight: '600' },
  nameRow: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 },
  nameText: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  verifiedBadge: { width: 22, height: 22, marginLeft: 4, flexShrink: 0 },
});
