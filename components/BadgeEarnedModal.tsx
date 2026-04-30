import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { UserBadge } from '@/services/badgeService';

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

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16) || 0;
  const r = ((num >> 16) & 0xff) + amount * 255;
  const g = ((num >> 8) & 0xff) + amount * 255;
  const b = (num & 0xff) + amount * 255;
  const clamp = (n: number) => Math.round(Math.max(0, Math.min(255, n)));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}

const BADGE_SIZE = 120;

export interface BadgeEarnedModalProps {
  visible: boolean;
  badge: UserBadge | null;
  onDismiss: () => void;
}

export function BadgeEarnedModal({ visible, badge, onDismiss }: BadgeEarnedModalProps) {
  const colors = useThemeColors();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && badge) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      scale.value = 0;
      opacity.value = 0;
      glowOpacity.value = 0;
      scale.value = withSequence(
        withSpring(1.15, { damping: 10, stiffness: 150 }),
        withSpring(1, { damping: 12, stiffness: 120 })
      );
      opacity.value = withTiming(1, { duration: 200 });
      glowOpacity.value = withDelay(100, withTiming(0.6, { duration: 400 }));
    }
  }, [visible, badge]);

  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  if (!badge) return null;

  const color = badge.color ?? '#0a7ea4';
  const light = adjustColor(color, 0.25);
  const dark = adjustColor(color, -0.2);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.overlayInner,
            { backgroundColor: 'rgba(0,0,0,0.7)' },
            overlayAnimatedStyle,
          ]}
        />
        <Pressable style={styles.content} onPress={(e) => e.stopPropagation()}>
          <Animated.View style={[styles.glowWrap, glowAnimatedStyle]}>
            <View
              style={[
                styles.glow,
                {
                  backgroundColor: color,
                  width: BADGE_SIZE + 60,
                  height: BADGE_SIZE + 60,
                  borderRadius: (BADGE_SIZE + 60) / 2,
                },
              ]}
            />
          </Animated.View>
          <Animated.View style={badgeAnimatedStyle}>
            <View
              style={[
                styles.badgeShadow,
                Platform.select({
                  ios: {
                    shadowColor: color,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                  },
                  android: { elevation: 16 },
                }),
              ]}
            >
              <LinearGradient
                colors={[light, color, dark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.badgeGradient,
                  {
                    width: BADGE_SIZE,
                    height: BADGE_SIZE,
                    borderRadius: BADGE_SIZE * 0.22,
                  },
                ]}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.4)', 'transparent']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 0.5 }}
                  style={[
                    styles.innerHighlight,
                    {
                      width: BADGE_SIZE,
                      height: BADGE_SIZE * 0.5,
                      borderTopLeftRadius: BADGE_SIZE * 0.22,
                      borderTopRightRadius: BADGE_SIZE * 0.22,
                    },
                  ]}
                />
                <View style={[styles.iconWrap, { width: BADGE_SIZE, height: BADGE_SIZE }]}>
                  <Ionicons
                    name={getIcon(badge.icon)}
                    size={BADGE_SIZE * 0.45}
                    color="#FFFFFF"
                  />
                </View>
              </LinearGradient>
            </View>
          </Animated.View>
          <Text style={[styles.title, { color: colors.text }]}>Badge earned!</Text>
          <Text style={[styles.badgeName, { color: colors.accent }]}>{badge.name}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {badge.description}
          </Text>
          <Pressable
            style={[styles.dismissBtn, { backgroundColor: colors.accent }]}
            onPress={onDismiss}
          >
            <Text style={[styles.dismissText, { color: colors.onAccent }]}>Awesome!</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayInner: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 1,
  },
  glowWrap: {
    position: 'absolute',
    top: -30,
  },
  glow: {
    opacity: 0.3,
  },
  badgeShadow: {
    marginBottom: 20,
    overflow: 'visible',
  },
  badgeGradient: {
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
  title: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  badgeName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: 260,
  },
  dismissBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  dismissText: {
    fontSize: 17,
    fontWeight: '700',
  },
});
