import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileScanPreview } from '@/components/ProfileScanPreview';
import { ThemedView } from '@/components/themed-view';
import { Layout, Tokens } from '@/constants/theme';
import { useProfile } from '@/hooks/useProfile';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getLinks, getProfileUrl, uploadAvatar, uploadVideoIntro } from '@/lib/api';
import type { ProfileTheme, SocialPlatform, UserLink, UserProfile } from '@/lib/supabase/types';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';

const SOCIAL_PLATFORMS: { key: SocialPlatform; label: string; placeholder: string }[] = [
  { key: 'instagram', label: 'Instagram', placeholder: 'instagram.com/username' },
  { key: 'tiktok', label: 'TikTok', placeholder: 'tiktok.com/@username' },
  { key: 'facebook', label: 'Facebook', placeholder: 'facebook.com/yourpage' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/yourprofile' },
  { key: 'youtube', label: 'YouTube', placeholder: 'youtube.com/@channel' },
  { key: 'threads', label: 'Threads', placeholder: 'threads.net/@username' },
  { key: 'x', label: 'X / Twitter', placeholder: 'x.com/username' },
];

const SOCIAL_ICONS: Record<SocialPlatform, keyof typeof Ionicons.glyphMap> = {
  instagram: 'logo-instagram',
  facebook: 'logo-facebook',
  linkedin: 'logo-linkedin',
  youtube: 'logo-youtube',
  tiktok: 'logo-tiktok',
  threads: 'logo-instagram',
  x: 'logo-twitter',
  other: 'link',
};

function openSocialUrl(url: string) {
  const u = url?.trim();
  if (!u) return;
  const withProtocol = /^https?:\/\//i.test(u) ? u : `https://${u}`;
  Linking.openURL(withProtocol).catch(() => {});
}

const ACCENT_COLORS = [Tokens.accent, '#71717A', '#A1A1AA', '#D4D4D8', '#E4E4E7', '#52525B', '#3F3F46', '#27272A', '#1A1A1D', Tokens.text];

type EditForm = Pick<UserProfile, 'username' | 'name' | 'title' | 'bio' | 'avatarUrl' | 'videoIntroUrl' | 'email' | 'phone' | 'website' | 'socialLinks' | 'theme'>;

function initEditForm(profile: UserProfile): EditForm {
  return {
    username: profile.username,
    name: profile.name,
    title: profile.title,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    videoIntroUrl: profile.videoIntroUrl,
    email: profile.email,
    phone: profile.phone,
    website: profile.website,
    socialLinks: { ...profile.socialLinks },
    theme: { ...profile.theme },
  };
}

export default function ProfileEditorScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { profile, loading: profileLoading, refresh, updateProfile } = useProfile();
  const { user } = useSession();
  const { isPro } = useSubscription();
  const [isEditing, setIsEditing] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [previewLinks, setPreviewLinks] = useState<UserLink[]>([]);

  // Sync editForm when entering edit mode
  useEffect(() => {
    if (isEditing && profile) {
      setEditForm(initEditForm(profile));
    } else {
      setEditForm(null);
    }
  }, [isEditing, profile?.id]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to photos to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !user?.id) return;
    setUploadingImage(true);
    try {
      const { url, error } = await uploadAvatar(user.id, result.assets[0].uri);
      if (url) {
        await updateProfile({ avatarUrl: url });
        await refresh();
        if (isEditing && editForm) setEditForm((f) => ({ ...f, avatarUrl: url }));
      } else {
        Alert.alert('Upload failed', error ?? 'Try again.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  }, [user?.id, updateProfile, refresh, isEditing, editForm]);

  const pickVideo = useCallback(async () => {
    if (!isPro) {
      Alert.alert('Pro feature', 'Video intro is available on the Pro plan.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to photos to add a video intro.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      videoMaxDuration: 20,
      quality: 0.8,
    });
    if (result.canceled || !user?.id) return;
    setUploadingVideo(true);
    try {
      const { url, error } = await uploadVideoIntro(user.id, result.assets[0].uri);
      if (url) {
        await updateProfile({ videoIntroUrl: url });
        await refresh();
        if (isEditing && editForm) setEditForm((f) => ({ ...f, videoIntroUrl: url }));
      } else if (error) {
        Alert.alert('Upload failed', error);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to upload video (max ~20 seconds)');
    } finally {
      setUploadingVideo(false);
    }
  }, [user?.id, updateProfile, refresh, isPro, isEditing, editForm]);

  const startEditing = useCallback(() => {
    if (profile) setEditForm(initEditForm(profile));
    setIsEditing(true);
  }, [profile]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditForm(null);
  }, []);

  const saveEditing = useCallback(async () => {
    if (!editForm) return;
    setSaving(true);
    try {
      await updateProfile(editForm);
      await refresh();
      setIsEditing(false);
      setEditForm(null);
    } catch (e) {
      Alert.alert('Error', 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }, [editForm, updateProfile, refresh]);

  const copyProfileLink = useCallback(async () => {
    if (!profile?.username) {
      Alert.alert('Set username', 'Add a username in your profile first.');
      return;
    }
    const url = getProfileUrl(profile.username);
    await Clipboard.setStringAsync(url);
    Alert.alert('Copied', 'Profile link copied to clipboard.');
  }, [profile?.username]);

  const shareProfile = useCallback(async () => {
    if (!profile?.username) {
      Alert.alert('Set username', 'Add a username in your profile first.');
      return;
    }
    const url = getProfileUrl(profile.username);
    try {
      await Share.share({
        message: url,
        url,
        title: profile.name?.trim() || 'My RingTap profile',
      });
    } catch (e) {
      await Clipboard.setStringAsync(url);
      Alert.alert('Link copied', 'Profile link copied to clipboard.');
    }
  }, [profile?.username, profile?.name]);

  const updateTheme = useCallback(
    (themeUpdates: Partial<ProfileTheme>) => {
      if (isEditing && editForm) {
        setEditForm((f) => ({ ...f, theme: { ...f.theme, ...themeUpdates } }));
      } else if (profile) {
        updateProfile({ theme: { ...profile.theme, ...themeUpdates } });
      }
    },
    [profile, updateProfile, isEditing, editForm]
  );

  // Create default profile if none exists
  useEffect(() => {
    if (!profileLoading && !profile && user?.id) {
      updateProfile({
        username: (user.email?.split('@')[0]?.replace(/[^a-z0-9]/gi, '')?.slice(0, 20)) || 'user',
        name: '',
        title: '',
        bio: '',
        email: user.email ?? '',
        phone: '',
        website: '',
      }).then((updated) => updated && refresh());
    }
  }, [profileLoading, profile, user?.id, user?.email, updateProfile, refresh]);

  // Load links when tab is focused
  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;
      getLinks(user.id).then(setPreviewLinks);
    }, [user?.id])
  );

  if (profileLoading || !profile) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  const displayProfile = isEditing && editForm ? { ...profile, ...editForm } : profile;

  return (
    <ThemedView style={styles.container}>
      {/* Header: Edit / Preview in view mode, Cancel / Save in edit mode */}
      <View style={[styles.headerRow, { borderBottomColor: colors.borderLight }]}>
        {isEditing ? (
          <>
            <Pressable onPress={cancelEditing} style={[styles.headerButton, { minWidth: 72 }]}>
              <Text style={[styles.headerButtonText, { color: colors.accent }]}>Cancel</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Edit profile</Text>
            <Pressable onPress={saveEditing} style={[styles.headerButton, { minWidth: 72 }]} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={[styles.headerButtonText, { color: colors.accent, fontWeight: '700' }]}>Save</Text>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.headerSpacer} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
            <View style={styles.headerActions}>
              <Pressable onPress={() => setPreviewModalVisible(true)} style={styles.headerButton}>
                <Ionicons name="eye-outline" size={22} color={colors.accent} />
                <Text style={[styles.headerButtonText, { color: colors.accent }]}>Preview</Text>
              </Pressable>
              <Pressable onPress={startEditing} style={styles.headerButton}>
                <Ionicons name="pencil" size={22} color={colors.accent} />
                <Text style={[styles.headerButtonText, { color: colors.accent }]}>Edit</Text>
              </Pressable>
            </View>
          </>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Layout.sectionGap }]}
        keyboardShouldPersistTaps="handled"
      >
        {isEditing && editForm ? (
          /* ---------- Edit mode: form ---------- */
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile picture</Text>
              <Pressable onPress={pickImage} disabled={uploadingImage} style={styles.avatarWrap}>
                {editForm.avatarUrl ? (
                  <Image source={{ uri: editForm.avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.borderLight }]}>
                    <Ionicons name="person" size={48} color={colors.textSecondary} />
                  </View>
                )}
                {uploadingImage && (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator color={colors.text} />
                  </View>
                )}
              </Pressable>
            </View>
            {isPro && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Video intro (Pro)</Text>
                <Pressable onPress={pickVideo} disabled={uploadingVideo} style={[styles.videoButton, { borderColor: colors.accent }]}>
                  {uploadingVideo ? (
                    <ActivityIndicator color={colors.accent} />
                  ) : (
                    <Text style={[styles.videoButtonText, { color: colors.accent }]}>
                      {editForm.videoIntroUrl ? 'Change video' : 'Add video (~20 sec)'}
                    </Text>
                  )}
                </Pressable>
              </View>
            )}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic info</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.borderLight, color: colors.text }]}
                placeholder="Username (for ringtap.me/username)"
                placeholderTextColor={colors.textSecondary}
                value={editForm.username}
                onChangeText={(v) => setEditForm((f) => (f ? { ...f, username: v } : f))}
                autoCapitalize="none"
              />
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Save to publish your profile at ringtap.me/{editForm.username || 'username'}
              </Text>
              <TextInput
                style={[styles.input, { borderColor: colors.borderLight, color: colors.text }]}
                placeholder="Name"
                placeholderTextColor={colors.textSecondary}
                value={editForm.name}
                onChangeText={(v) => setEditForm((f) => (f ? { ...f, name: v } : f))}
              />
              <TextInput
                style={[styles.input, { borderColor: colors.borderLight, color: colors.text }]}
                placeholder="Title"
                placeholderTextColor={colors.textSecondary}
                value={editForm.title}
                onChangeText={(v) => setEditForm((f) => (f ? { ...f, title: v } : f))}
              />
              <TextInput
                style={[styles.input, styles.bio, { borderColor: colors.borderLight, color: colors.text }]}
                placeholder="Bio"
                placeholderTextColor={colors.textSecondary}
                value={editForm.bio}
                onChangeText={(v) => setEditForm((f) => (f ? { ...f, bio: v } : f))}
                multiline
              />
            </View>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Contact</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.borderLight, color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.textSecondary}
                value={editForm.email}
                onChangeText={(v) => setEditForm((f) => (f ? { ...f, email: v } : f))}
                keyboardType="email-address"
              />
              <TextInput
                style={[styles.input, { borderColor: colors.borderLight, color: colors.text }]}
                placeholder="Phone"
                placeholderTextColor={colors.textSecondary}
                value={editForm.phone}
                onChangeText={(v) => setEditForm((f) => (f ? { ...f, phone: v } : f))}
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.input, { borderColor: colors.borderLight, color: colors.text }]}
                placeholder="Website"
                placeholderTextColor={colors.textSecondary}
                value={editForm.website}
                onChangeText={(v) => setEditForm((f) => (f ? { ...f, website: v } : f))}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Social links</Text>
              <Text style={[styles.hint, { color: colors.textSecondary, marginBottom: Layout.rowGap }]}>
                Add full URLs (e.g. facebook.com/yourpage). Tappable icons will show on your card.
              </Text>
              {SOCIAL_PLATFORMS.map(({ key, label, placeholder }) => (
                <View key={key} style={styles.socialInputRow}>
                  <Ionicons name={SOCIAL_ICONS[key]} size={20} color={colors.textSecondary} style={styles.socialInputIcon} />
                  <TextInput
                    style={[styles.input, styles.socialInput, { borderColor: colors.borderLight, color: colors.text }]}
                    placeholder={placeholder}
                    placeholderTextColor={colors.textSecondary}
                    value={editForm.socialLinks[key] ?? ''}
                    onChangeText={(v) =>
                      setEditForm((f) => (f ? { ...f, socialLinks: { ...f.socialLinks, [key]: v } } : f))
                    }
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>
              ))}
            </View>
            {isPro && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Theme</Text>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Accent color</Text>
                <View style={styles.colorRow}>
                  {ACCENT_COLORS.map((color, index) => (
                    <Pressable
                      key={`accent-${index}`}
                      style={[
                        styles.colorDot,
                        { backgroundColor: color },
                        editForm.theme.accentColor === color && styles.colorDotSelected,
                      ]}
                      onPress={() => updateTheme({ accentColor: color })}
                    />
                  ))}
                </View>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Button shape</Text>
                <View style={styles.row}>
                  {(['rounded', 'pill', 'square'] as const).map((shape) => (
                    <Pressable
                      key={shape}
                      style={[
                        styles.shapeButton,
                        { borderColor: colors.borderLight },
                        editForm.theme.buttonShape === shape && { borderColor: colors.accent, backgroundColor: colors.surface },
                      ]}
                      onPress={() => updateTheme({ buttonShape: shape })}
                    >
                      <Text style={[styles.shapeButtonText, { color: colors.text }]}>{shape}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : (
          /* ---------- View mode: read-only profile (layout like scan preview) ---------- */
          <>
            <View style={[styles.viewCard, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              {/* Centered header: avatar, name, title, tagline */}
              <View style={styles.viewCardHeaderCentered}>
                {profile.avatarUrl ? (
                  <Image source={{ uri: profile.avatarUrl }} style={styles.viewCardAvatarLarge} />
                ) : (
                  <View style={[styles.viewCardAvatarPlaceholder, { backgroundColor: colors.borderLight }]}>
                    <Ionicons name="person" size={48} color={colors.textSecondary} />
                  </View>
                )}
                <View style={styles.viewCardNameRow}>
                  <Text style={[styles.viewCardName, { color: colors.text }]} numberOfLines={1}>
                    {profile.name?.trim() || 'Your name'}
                  </Text>
                  {isPro ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.accent} style={styles.verifiedBadge} />
                  ) : null}
                </View>
                {profile.title?.trim() ? (
                  <Text style={[styles.viewCardTitle, { color: colors.textSecondary }]} numberOfLines={1}>{profile.title}</Text>
                ) : null}
                {profile.bio?.trim() ? (
                  <Text style={[styles.viewCardTagline, { color: colors.textSecondary }]} numberOfLines={2}>{profile.bio}</Text>
                ) : null}
              </View>

              {profile.videoIntroUrl ? (
                <View style={styles.viewCardVideoWrap}>
                  <Video
                    source={{ uri: profile.videoIntroUrl }}
                    style={styles.viewCardVideo}
                    resizeMode={ResizeMode.CONTAIN}
                    useNativeControls
                    isLooping={false}
                    shouldPlay={false}
                  />
                </View>
              ) : null}

              {(profile.bio?.trim() || profile.email?.trim() || profile.phone?.trim() || profile.website?.trim() || Object.entries(profile.socialLinks || {}).some(([, v]) => v?.trim())) ? (
                <>
                  <View style={[styles.viewCardSeparator, { backgroundColor: colors.borderLight }]} />
                  {profile.bio?.trim() ? (
                    <>
                      <Text style={[styles.viewCardSectionTitle, { color: colors.text }]}>About Me</Text>
                      <Text style={[styles.viewCardBio, { color: colors.textSecondary }]}>{profile.bio}</Text>
                      <View style={[styles.viewCardSeparator, { backgroundColor: colors.borderLight }]} />
                    </>
                  ) : null}
                  {(profile.email?.trim() || profile.phone?.trim() || profile.website?.trim()) ? (
                    <>
                      <Text style={[styles.viewCardSectionTitle, { color: colors.text }]}>Contact</Text>
                      <View style={styles.viewCardContact}>
                        {profile.email?.trim() ? (
                          <Pressable style={styles.contactRow} onPress={() => Linking.openURL(`mailto:${profile.email?.trim()}`)}>
                            <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                            <Text style={[styles.contactDetailText, { color: colors.textSecondary }]} numberOfLines={1}>{profile.email}</Text>
                          </Pressable>
                        ) : null}
                        {profile.website?.trim() ? (
                          <Pressable style={styles.contactRow} onPress={() => openSocialUrl(profile.website?.trim() ?? '')}>
                            <Ionicons name="globe-outline" size={16} color={colors.textSecondary} />
                            <Text style={[styles.contactDetailText, { color: colors.textSecondary }]} numberOfLines={1}>{profile.website}</Text>
                          </Pressable>
                        ) : null}
                        {profile.phone?.trim() ? (
                          <Pressable style={styles.contactRow} onPress={() => Linking.openURL(`tel:${profile.phone?.trim()}`)}>
                            <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                            <Text style={[styles.contactDetailText, { color: colors.textSecondary }]} numberOfLines={1}>{profile.phone}</Text>
                          </Pressable>
                        ) : null}
                      </View>
                      {Object.entries(profile.socialLinks || {}).some(([, v]) => v?.trim()) ? (
                        <View style={[styles.viewCardSeparator, { backgroundColor: colors.borderLight }]} />
                      ) : null}
                    </>
                  ) : null}
                  {Object.entries(profile.socialLinks || {}).some(([, v]) => v?.trim()) ? (
                    <View style={styles.viewCardSocial}>
                      {SOCIAL_PLATFORMS.map(({ key, label }) => {
                        const url = profile.socialLinks?.[key]?.trim();
                        if (!url) return null;
                        return (
                          <Pressable key={key} style={[styles.viewCardSocialChip, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderLight }]} onPress={() => openSocialUrl(url)}>
                            <Ionicons name={SOCIAL_ICONS[key]} size={20} color={colors.accent} />
                            <Text style={[styles.viewCardSocialChipText, { color: colors.text }]} numberOfLines={1}>{label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile link</Text>
              {profile.username ? (
                <Text style={[styles.profileUrl, { color: colors.textSecondary }]}>{getProfileUrl(profile.username)}</Text>
              ) : (
                <Text style={[styles.hint, { color: colors.textSecondary }]}>Edit profile and set a username to get your link.</Text>
              )}
              <View style={styles.row}>
                <Pressable style={[styles.primaryButton, { backgroundColor: colors.accent }]} onPress={copyProfileLink}>
                  <Ionicons name="copy-outline" size={20} color={colors.primary} />
                  <Text style={[styles.primaryButtonText, { color: colors.primary }]}>Copy link</Text>
                </Pressable>
                <Pressable style={[styles.secondaryButton, { borderColor: colors.accent }]} onPress={shareProfile}>
                  <Ionicons name="share-outline" size={20} color={colors.accent} />
                  <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>Share</Text>
                </Pressable>
              </View>
            </View>

          </>
        )}
      </ScrollView>

      {/* Preview profile modal */}
      <Modal visible={previewModalVisible} animationType="slide" transparent statusBarTranslucent>
        <View style={[styles.previewModalOverlay, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
          <View style={styles.previewModalHeader}>
            <Text style={[styles.previewModalTitle, { color: colors.text }]}>Preview profile</Text>
            <Pressable onPress={() => setPreviewModalVisible(false)} hitSlop={12}>
              <Ionicons name="close" size={28} color={colors.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={[styles.previewModalContent, { paddingBottom: insets.bottom + 24 }]}>
            <ProfileScanPreview
              profile={displayProfile}
              links={previewLinks}
              onSaveContact={copyProfileLink}
              footerText={profile.username ? 'Tap or scan the QR to connect instantly via RingTap.' : undefined}
              showVerified={isPro}
            />
          </ScrollView>
        </View>
      </Modal>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Layout.screenPadding },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerButton: { padding: Layout.tightGap, flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerButtonText: { fontSize: Layout.body },
  headerSpacer: { width: 80 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewCard: {
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusXl,
    borderWidth: 1,
    marginBottom: Layout.sectionGap,
  },
  viewCardHeaderCentered: { alignItems: 'center', marginBottom: Layout.rowGap },
  viewCardAvatarLarge: { width: 88, height: 88, borderRadius: 44, marginBottom: Layout.rowGap },
  viewCardAvatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Layout.rowGap,
  },
  viewCardNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  viewCardName: { fontSize: 22, fontWeight: '700', textAlign: 'center' },
  verifiedBadge: { marginLeft: 2 },
  viewCardTitle: { fontSize: Layout.body, marginTop: 4, textAlign: 'center' },
  viewCardTagline: { fontSize: Layout.bodySmall, lineHeight: 20, marginTop: 6, textAlign: 'center' },
  viewCardVideoWrap: { width: '100%', aspectRatio: 16 / 9, marginBottom: Layout.rowGap, borderRadius: Layout.radiusMd, overflow: 'hidden' },
  viewCardVideo: { width: '100%', height: '100%' },
  viewCardSeparator: { height: StyleSheet.hairlineWidth, marginVertical: Layout.rowGap },
  viewCardSectionTitle: { fontSize: Layout.body, fontWeight: '700', marginBottom: Layout.tightGap },
  viewCardBio: { fontSize: Layout.bodySmall, lineHeight: 22, marginBottom: Layout.rowGap },
  viewCardContact: { marginBottom: Layout.rowGap },
  viewCardSocial: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.tightGap },
  viewCardSocialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Layout.radiusMd,
    borderWidth: 1,
  },
  viewCardSocialChipText: { fontSize: Layout.bodySmall, fontWeight: '500' },
  previewModalOverlay: {
    flex: 1,
  },
  previewModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 12,
  },
  previewModalTitle: { fontSize: 18, fontWeight: '700' },
  previewModalContent: { padding: Layout.screenPadding, paddingBottom: 40 },
  section: { marginBottom: Layout.sectionGap },
  sectionTitle: { fontSize: Layout.titleSection, fontWeight: '600', marginBottom: Layout.titleSectionMarginBottom },
  sectionSubtitle: { fontSize: Layout.subtitleSection, marginBottom: Layout.subtitleSectionMarginBottom },
  label: { fontSize: Layout.bodySmall, marginBottom: Layout.labelMarginBottom },
  input: {
    height: Layout.inputHeight,
    borderWidth: 1,
    borderRadius: Layout.radiusMd,
    paddingHorizontal: 16,
    fontSize: Layout.body,
    marginBottom: Layout.inputMarginBottom,
  },
  socialInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.inputMarginBottom,
  },
  socialInputIcon: { marginRight: 10 },
  socialInput: { flex: 1, marginBottom: 0 },
  bio: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  avatarWrap: { alignSelf: 'flex-start', position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoButton: {
    height: Layout.inputHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Layout.radiusMd,
  },
  videoButtonText: { fontWeight: '600' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Layout.inputGap, marginBottom: Layout.rowGap },
  colorDot: { width: 36, height: 36, borderRadius: 18 },
  colorDotSelected: { borderWidth: 3, borderColor: '#000' },
  row: { flexDirection: 'row', gap: Layout.rowGap, marginBottom: Layout.rowGap },
  shapeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Layout.radiusSm,
    borderWidth: 1,
  },
  shapeButtonText: { fontSize: Layout.bodySmall },
  profileUrl: { fontSize: Layout.bodySmall, marginBottom: Layout.inputGap },
  hint: { fontSize: Layout.bodySmall, marginBottom: Layout.inputGap },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.tightGap,
    height: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
  },
  primaryButtonText: { fontWeight: '600' },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.tightGap,
    height: Layout.buttonHeight,
    borderWidth: 1,
    borderRadius: Layout.radiusMd,
  },
  secondaryButtonText: { fontWeight: '600' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: Layout.tightGap, marginBottom: 4 },
  contactDetailText: { fontSize: Layout.caption, flex: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: Layout.radiusXl,
    borderTopRightRadius: Layout.radiusXl,
    padding: Layout.cardPadding,
    paddingBottom: Layout.screenPaddingBottom,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  modalSubtitle: { fontSize: Layout.caption, marginBottom: 20 },
  modalInput: {
    height: Layout.inputHeight,
    borderWidth: 1,
    borderRadius: Layout.radiusMd,
    paddingHorizontal: 16,
    fontSize: Layout.body,
    marginBottom: Layout.rowGap,
  },
  modalActions: { flexDirection: 'row', gap: Layout.rowGap, marginTop: Layout.tightGap },
  modalCancel: {
    flex: 1,
    height: Layout.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Layout.radiusMd,
  },
  modalCancelText: { fontSize: Layout.body, fontWeight: '600' },
  modalSave: {
    flex: 1,
    height: Layout.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Layout.radiusMd,
  },
  modalSaveText: { fontSize: Layout.body, fontWeight: '600' },
});
