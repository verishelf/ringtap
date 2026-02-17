import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import * as Linking from 'expo-linking';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getProfileFontFamily } from '@/lib/profileFonts';
import { Layout } from '@/constants/theme';
import { CashAppIcon } from '@/components/CashAppIcon';
import { VenmoIcon, PayPalIcon, ZelleIcon } from '@/components/PaymentIcons';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ButtonShape, SocialPlatform, UserLink, UserProfile } from '@/lib/supabase/types';

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  threads: 'Threads',
  x: 'X',
  cashapp: 'Cash App',
  venmo: 'Venmo',
  paypal: 'PayPal',
  zelle: 'Zelle',
  other: 'Link',
};

const SOCIAL_ICONS: Record<SocialPlatform, keyof typeof Ionicons.glyphMap> = {
  instagram: 'logo-instagram',
  facebook: 'logo-facebook',
  linkedin: 'logo-linkedin',
  youtube: 'logo-youtube',
  tiktok: 'logo-tiktok',
  threads: 'logo-instagram',
  x: 'logo-twitter',
  cashapp: 'cash-outline',
  venmo: 'logo-venmo',
  paypal: 'logo-paypal',
  zelle: 'card-outline',
  other: 'link',
};

function openSocialUrl(url: string) {
  const u = url.trim();
  if (!u) return;
  const withProtocol = /^https?:\/\//i.test(u) ? u : `https://${u}`;
  Linking.openURL(withProtocol).catch(() => {});
}

function normalizeSocialUrl(key: string, raw: string): string {
  let value = raw.trim();
  if (!value) return value;

  // Cash App: allow $cashtag or username, or full link
  if (key === 'cashapp') {
    // If full link already, leave as-is
    if (/^https?:\/\//i.test(value) || value.includes('cash.app')) return value;
    // Ensure it starts with $
    if (!value.startsWith('$')) {
      value = `$${value}`;
    }
    return `https://cash.app/${value}`;
  }

  // Venmo: allow @handle, handle, or full link
  if (key === 'venmo') {
    if (/^https?:\/\//i.test(value) || value.includes('venmo.com')) return value;
    if (value.startsWith('@')) {
      value = value.slice(1);
    }
    return `https://venmo.com/${value}`;
  }

  return value;
}

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
  /** Called when "Save Contact" is pressed (e.g. copy profile link). If provided, the Save Contact button is shown. */
  onSaveContact?: () => void;
  /** Called when "Message" is pressed. If provided, the Message button is shown. */
  onMessage?: () => void;
  /** Optional footer line(s) shown below the main CTA. */
  footerText?: string;
  /** When true, show a verified checkmark next to the name (e.g. for Pro). */
  showVerified?: boolean;
  /** When true, show a gold ring around the profile avatar (e.g. for Pro). */
  showProRing?: boolean;
  /** When false, suppress the \"About Me\" section (bio) in the body to avoid repeating it. */
  showAboutSection?: boolean;
}

const PRO_RING_COLOR = '#D4AF37';

export function ProfileScanPreview({
  profile,
  links,
  onSaveContact,
  onMessage,
  footerText,
  showVerified,
  showProRing,
  showAboutSection = true,
}: ProfileScanPreviewProps) {
  const colors = useThemeColors();
  const accent = profile.theme?.accentColor ?? colors.accent;
  const shape = profile.theme?.buttonShape ?? 'rounded';
  const radius = buttonRadius(shape);
  const fontFamily = getProfileFontFamily(profile.theme?.typography);

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
  const hasContent =
    profile.bio?.trim() ||
    hasContact ||
    socialWithUrls.length > 0 ||
    links.length > 0;

  const borderColor = (showProRing && (profile.theme?.profileBorderColor ?? PRO_RING_COLOR)) || colors.borderLight;
  const cardBorderColor = showProRing ? (profile.theme?.profileBorderColor ?? PRO_RING_COLOR) : colors.borderLight;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.card, { borderColor: cardBorderColor, backgroundColor: colors.surface }]}>
        {/* Header with optional background behind avatar, name, title, tagline */}
        <View style={styles.headerOuter}>
          {profile.backgroundImageUrl ? (
            <View style={styles.headerBackgroundWrap}>
              <Image source={{ uri: profile.backgroundImageUrl }} style={styles.headerBackgroundImage} contentFit="cover" />
              <View style={[styles.headerBackgroundOverlay, { backgroundColor: colors.surface + '99' }]} />
            </View>
          ) : null}
          <View style={styles.headerCentered}>
            <View style={[styles.avatarWrap, showProRing && [styles.avatarProRing, { borderColor }]]}>
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarLarge} />
              ) : (
                <View style={[styles.avatarLargePlaceholder, { backgroundColor: colors.borderLight }]}>
                  <Ionicons name="person" size={48} color={colors.textSecondary} />
                </View>
              )}
            </View>
            <View style={styles.nameRow}>
              <Text style={[styles.nameCentered, { color: colors.text, fontFamily }]} numberOfLines={1}>
                {profile.name?.trim() || 'Your name'}
              </Text>
              {showVerified ? (
                <Image
                  source={require('@/assets/images/verified.png')}
                  style={styles.verifiedBadge}
                />
              ) : null}
            </View>
            {profile.title?.trim() ? (
              <Text style={[styles.titleCentered, { color: colors.textSecondary, fontFamily }]} numberOfLines={1}>
                {profile.title}
              </Text>
            ) : null}
            {profile.bio?.trim() ? (
              <Text style={[styles.tagline, { color: colors.textSecondary, fontFamily }]} numberOfLines={2}>
                {profile.bio}
              </Text>
            ) : null}
          </View>
        </View>

        {profile.videoIntroUrl ? (
          <View style={styles.videoWrap}>
            <Video
              source={{ uri: profile.videoIntroUrl }}
              style={styles.videoIntro}
              resizeMode={ResizeMode.CONTAIN}
              useNativeControls
              isLooping={false}
              shouldPlay={false}
            />
          </View>
        ) : null}

        {hasContent ? (
          <>
            <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />

            {showAboutSection && profile.bio?.trim() ? (
              <>
                <Text style={[styles.sectionHeading, { color: colors.text, fontFamily }]}>About Me</Text>
                <Text style={[styles.bio, { color: colors.textSecondary, fontFamily }]}>
                  {profile.bio}
                </Text>
                <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />
              </>
            ) : null}

            {hasContact && (
              <>
                <Text style={[styles.sectionHeading, { color: colors.text, fontFamily }]}>Contact</Text>
                <View style={styles.contact}>
                  {profile.email?.trim() ? (
                    <Pressable
                      style={styles.contactRow}
                      onPress={() => Linking.openURL(`mailto:${profile.email?.trim()}`)}
                    >
                      <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.contactText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {profile.email}
                      </Text>
                    </Pressable>
                  ) : null}
                  {profile.website?.trim() ? (
                    <Pressable
                      style={styles.contactRow}
                      onPress={() => openSocialUrl(profile.website?.trim() ?? '')}
                    >
                      <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.contactText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {profile.website}
                      </Text>
                    </Pressable>
                  ) : null}
                  {profile.phone?.trim() ? (
                    <Pressable
                      style={styles.contactRow}
                      onPress={() => Linking.openURL(`tel:${profile.phone?.trim()}`)}
                    >
                      <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.contactText, { color: colors.textSecondary }]} numberOfLines={1}>
                        {profile.phone}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                {(socialWithUrls.length > 0 || links.length > 0) ? (
                  <View style={[styles.separator, { backgroundColor: colors.borderLight }]} />
                ) : null}
              </>
            )}

            {socialWithUrls.length > 0 && (
              <View style={styles.socialRow}>
                {socialWithUrls.map(({ key, label, url }) => (
                  <Pressable
                    key={key}
                    style={[styles.socialChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]}
                    onPress={() => openSocialUrl(normalizeSocialUrl(key, url))}
                  >
                    {key === 'cashapp' && <CashAppIcon size={20} />}
                    {key === 'venmo' && <VenmoIcon size={20} />}
                    {key === 'paypal' && <PayPalIcon size={20} />}
                    {key === 'zelle' && <ZelleIcon size={20} />}
                    {key !== 'cashapp' && key !== 'venmo' && key !== 'paypal' && key !== 'zelle' && (
                      <Ionicons
                        name={SOCIAL_ICONS[key as SocialPlatform] ?? 'link'}
                        size={20}
                        color={colors.accent}
                      />
                    )}
                    <Text style={[styles.socialChipText, { color: colors.text }]} numberOfLines={1}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {links.length > 0 && (
              <View style={styles.links}>
                {links.map((link) => (
                  <Pressable
                    key={link.id}
                    style={[
                      styles.linkButton,
                      { backgroundColor: accent, borderRadius: radius },
                    ]}
                    onPress={() => openSocialUrl(link.url)}
                  >
                    <Text style={[styles.linkButtonText, { color: colors.primary }]} numberOfLines={1}>
                      {link.title || link.url}
                    </Text>
                    <Ionicons name="open-outline" size={16} color={colors.primary} />
                  </Pressable>
                ))}
              </View>
            )}

            {profile.theme?.calendlyUrl?.trim() ? (
              <Pressable
                style={[styles.saveContactButton, styles.messageButton, { borderColor: accent, borderRadius: radius }]}
                onPress={() => openSocialUrl(profile.theme!.calendlyUrl!.trim())}
              >
                <Ionicons name="calendar-outline" size={22} color={accent} />
                <Text style={[styles.saveContactText, { color: accent }]}>Schedule</Text>
              </Pressable>
            ) : null}

            {onSaveContact && (
              <Pressable
                style={[styles.saveContactButton, { backgroundColor: accent, borderRadius: radius }]}
                onPress={onSaveContact}
              >
                <Ionicons name="qr-code-outline" size={22} color={colors.primary} />
                <Text style={[styles.saveContactText, { color: colors.primary }]}>Save Contact</Text>
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              </Pressable>
            )}

            {onMessage && (
              <Pressable
                style={[styles.saveContactButton, styles.messageButton, { borderColor: accent, borderRadius: radius }]}
                onPress={onMessage}
              >
                <Ionicons name="chatbubble-outline" size={22} color={accent} />
                <Text style={[styles.saveContactText, { color: accent }]}>Message</Text>
              </Pressable>
            )}

            {footerText ? (
              <Text style={[styles.footer, { color: colors.textSecondary }]}>{footerText}</Text>
            ) : null}
          </>
        ) : (
          <Text style={[styles.placeholder, { color: colors.textSecondary }]}>Add info and links to see your card here.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: Layout.tightGap },
  card: {
    borderRadius: Layout.radiusXl,
    borderWidth: 1,
    padding: Layout.cardPadding,
  },
  headerCentered: { alignItems: 'center', marginBottom: Layout.rowGap },
  avatarWrap: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: Layout.rowGap },
  avatarProRing: { width: 94, height: 94, borderRadius: 47, borderWidth: 3, borderColor: PRO_RING_COLOR, marginBottom: Layout.rowGap },
  avatarLarge: { width: 88, height: 88, borderRadius: 44 },
  avatarLargePlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  nameCentered: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  verifiedBadge: { marginLeft: 2 },
  titleCentered: { fontSize: Layout.body, marginTop: 4, textAlign: 'center' },
  tagline: { fontSize: Layout.bodySmall, lineHeight: 20, marginTop: 6, textAlign: 'center', paddingHorizontal: 8 },
  headerOuter: { position: 'relative', width: '100%' },
  headerBackgroundWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  headerBackgroundImage: { width: '100%', height: '100%' },
  headerBackgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  videoWrap: { width: '100%', aspectRatio: 16 / 9, marginBottom: Layout.rowGap, borderRadius: Layout.radiusMd, overflow: 'hidden' },
  videoIntro: { width: '100%', height: '100%' },
  separator: { height: StyleSheet.hairlineWidth, marginVertical: Layout.rowGap },
  sectionHeading: { fontSize: Layout.body, fontWeight: '700', marginBottom: Layout.tightGap },
  bio: { fontSize: Layout.bodySmall, lineHeight: 22, marginBottom: Layout.rowGap },
  contact: { marginBottom: Layout.rowGap },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: Layout.tightGap, marginBottom: 8 },
  contactText: { fontSize: Layout.bodySmall, flex: 1 },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.tightGap, marginBottom: Layout.rowGap },
  socialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
  },
  socialChipText: { fontSize: Layout.bodySmall, fontWeight: '500' },
  links: { gap: Layout.inputGap, marginBottom: Layout.rowGap },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  linkButtonText: { fontSize: Layout.bodySmall + 1, fontWeight: '600', flex: 1 },
  saveContactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    marginBottom: Layout.rowGap,
  },
  messageButton: { backgroundColor: 'transparent', borderWidth: 2 },
  saveContactText: { fontSize: Layout.body, fontWeight: '700' },
  footer: { fontSize: Layout.caption, textAlign: 'center', lineHeight: 18 },
  placeholder: { fontSize: Layout.caption, fontStyle: 'italic' },
});
