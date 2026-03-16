import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { UserBadge } from '@/services/badgeService';

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  sunrise: 'sunny-outline',
  flame: 'flame-outline',
  zap: 'flash-outline',
  crown: 'trophy-outline',
  refresh: 'refresh-outline',
  radio: 'radio-outline',
  'trending-up': 'trending-up-outline',
  'person-add': 'person-add-outline',
  people: 'people-outline',
  globe: 'globe-outline',
  link: 'link-outline',
  layers: 'layers-outline',
  eye: 'eye-outline',
  star: 'star-outline',
};

function getIcon(name: string): keyof typeof Ionicons.glyphMap {
  return ICON_MAP[name] ?? 'ribbon-outline';
}

export interface BadgeDisplayProps {
  badges: UserBadge[];
  maxVisible?: number;
  onPress?: () => void;
  compact?: boolean;
}

/** Compact badge strip for home/profile. */
export function BadgeDisplay({
  badges,
  maxVisible = 5,
  onPress,
  compact = false,
}: BadgeDisplayProps) {
  const colors = useThemeColors();
  const router = useRouter();
  const visible = badges.slice(0, maxVisible);

  if (badges.length === 0) return null;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/(tabs)/profile/badges' as const);
    }
  };

  return (
    <Pressable
      style={[styles.strip, { backgroundColor: colors.surface + 'F5', borderColor: colors.borderLight }]}
      onPress={handlePress}
    >
      <View style={styles.stripContent}>
        {visible.map((b) => (
          <View
            key={b.id}
            style={[styles.badgePill, { backgroundColor: (b.color ?? colors.accent) + '25' }]}
          >
            <Ionicons
              name={getIcon(b.icon)}
              size={compact ? 14 : 18}
              color={b.color ?? colors.accent}
            />
            {!compact && (
              <Text style={[styles.badgeName, { color: colors.text }]} numberOfLines={1}>
                {b.name}
              </Text>
            )}
          </View>
        ))}
        {badges.length > maxVisible && (
          <Text style={[styles.moreLabel, { color: colors.textSecondary }]}>
            +{badges.length - maxVisible}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

/** Full-screen modal to view all badges. */
export function BadgesModal({
  visible,
  onClose,
  badges,
}: {
  visible: boolean;
  onClose: () => void;
  badges: UserBadge[];
}) {
  const colors = useThemeColors();

  const byCategory = badges.reduce<Record<string, UserBadge[]>>((acc, b) => {
    const cat = b.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(b);
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    engagement: 'Coming back',
    sharing: 'Sharing',
    networking: 'Networking',
    profile: 'Profile',
    other: 'Other',
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.borderLight }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Your badges</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
        </View>
        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          {badges.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="ribbon-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No badges yet</Text>
              <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
                Open the app regularly, share your profile, and save contacts to earn badges.
              </Text>
            </View>
          ) : (
            Object.entries(byCategory).map(([cat, items]) => (
              <View key={cat} style={styles.categorySection}>
                <Text style={[styles.categoryTitle, { color: colors.textSecondary }]}>
                  {categoryLabels[cat] ?? cat}
                </Text>
                {items.map((b) => (
                  <View
                    key={b.id}
                    style={[styles.badgeRow, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}
                  >
                    <View style={[styles.badgeIconWrap, { backgroundColor: (b.color ?? colors.accent) + '25' }]}>
                      <Ionicons
                        name={getIcon(b.icon)}
                        size={24}
                        color={b.color ?? colors.accent}
                      />
                    </View>
                    <View style={styles.badgeInfo}>
                      <Text style={[styles.badgeRowName, { color: colors.text }]}>{b.name}</Text>
                      <Text style={[styles.badgeRowDesc, { color: colors.textSecondary }]}>
                        {b.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  stripContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 80,
  },
  moreLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  modalScroll: { flex: 1 },
  modalContent: { padding: 20, paddingBottom: 40 },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
  },
  categorySection: { marginBottom: 24 },
  categoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  badgeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  badgeInfo: { flex: 1, minWidth: 0 },
  badgeRowName: { fontSize: 16, fontWeight: '600' },
  badgeRowDesc: { fontSize: 13, marginTop: 2 },
});
