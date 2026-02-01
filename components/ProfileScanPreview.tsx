import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ButtonShape, UserLink, UserProfile } from '@/lib/supabase/types';

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  threads: 'Threads',
  x: 'X',
  other: 'Link',
};

function buttonRadius(shape: ButtonShape): number {
  switch (shape) {
    case 'pill':
      return 24;
    case 'square':
      return 4;
    default:
      return 12;
  }
}

interface ProfileScanPreviewProps {
  profile: UserProfile;
  links: UserLink[];
}

export function ProfileScanPreview({ profile, links }: ProfileScanPreviewProps) {
  const colors = useThemeColors();
  const accent = profile.theme?.accentColor ?? colors.accent;
  const shape = profile.theme?.buttonShape ?? 'rounded';
  const radius = buttonRadius(shape);

  const socialWithUrls = useMemo(() => {
    const out: { key: string; label: string; url: string }[] = [];
    const social = profile.socialLinks ?? {};
    (Object.keys(social) as (keyof typeof social)[]).forEach((key) => {
      const url = social[key];
      if (url && url.trim()) {
        out.push({ key, label: SOCIAL_LABELS[key] ?? key, url: url.trim() });
      }
    });
    return out;
  }, [profile.socialLinks]);

  const hasContact = !!(profile.email?.trim() || profile.phone?.trim() || profile.website?.trim());

  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, { borderColor: colors.borderLight, backgroundColor: colors.surface }]}>
        {/* Avatar + name block */}
        <View style={styles.header}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.borderLight }]}>
              <Ionicons name="person" size={32} color={colors.textSecondary} />
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {profile.name?.trim() || 'Your name'}
            </Text>
            {profile.title?.trim() ? (
              <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={1}>
                {profile.title}
              </Text>
            ) : null}
          </View>
        </View>

        {profile.bio?.trim() ? (
          <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={4}>
            {profile.bio}
          </Text>
        ) : null}

        {hasContact && (
          <View style={styles.contact}>
            {profile.email?.trim() ? (
              <View style={styles.contactRow}>
                <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.contactText, { color: colors.text }]} numberOfLines={1}>
                  {profile.email}
                </Text>
              </View>
            ) : null}
            {profile.phone?.trim() ? (
              <View style={styles.contactRow}>
                <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.contactText, { color: colors.text }]} numberOfLines={1}>
                  {profile.phone}
                </Text>
              </View>
            ) : null}
            {profile.website?.trim() ? (
              <View style={styles.contactRow}>
                <Ionicons name="globe-outline" size={14} color={colors.textSecondary} />
                <Text style={[styles.contactText, { color: colors.text }]} numberOfLines={1}>
                  {profile.website}
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {socialWithUrls.length > 0 && (
          <View style={styles.socialRow}>
            {socialWithUrls.map(({ key, label }) => (
              <View key={key} style={[styles.socialChip, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.socialChipText, { color: colors.text }]}>{label}</Text>
              </View>
            ))}
          </View>
        )}

        {links.length > 0 && (
          <View style={styles.links}>
            {links.map((link) => (
              <View
                key={link.id}
                style={[
                  styles.linkButton,
                  { backgroundColor: accent, borderRadius: radius },
                ]}
              >
                <Text style={[styles.linkButtonText, { color: colors.primary }]} numberOfLines={1}>
                  {link.title || link.url}
                </Text>
                <Ionicons name="open-outline" size={16} color={colors.primary} />
              </View>
            ))}
          </View>
        )}

        {links.length === 0 && socialWithUrls.length === 0 && !profile.bio?.trim() && !hasContact && (
          <Text style={[styles.placeholder, { color: colors.textSecondary }]}>Add info and links to see your card here.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Layout.tightGap },
  card: {
    borderRadius: Layout.radiusLg,
    borderWidth: 1,
    padding: Layout.cardPadding,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Layout.rowGap },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: { flex: 1, marginLeft: 14 },
  name: { fontSize: Layout.titleSection + 1, fontWeight: '700', marginTop: 0 },
  title: { fontSize: Layout.bodySmall, marginTop: 2 },
  bio: { fontSize: Layout.bodySmall, lineHeight: 20, marginBottom: Layout.rowGap },
  contact: { marginBottom: Layout.rowGap },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: Layout.tightGap, marginBottom: 4 },
  contactText: { fontSize: Layout.caption, flex: 1 },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.tightGap, marginBottom: Layout.rowGap },
  socialChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: Layout.radiusSm },
  socialChipText: { fontSize: Layout.caption - 1 },
  links: { gap: Layout.inputGap },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  linkButtonText: { fontSize: Layout.bodySmall + 1, fontWeight: '600', flex: 1 },
  placeholder: { fontSize: Layout.caption, fontStyle: 'italic' },
});
