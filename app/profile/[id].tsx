import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileScanPreview } from '@/components/ProfileScanPreview';
import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useSession } from '@/hooks/useSession';
import {
  getProfile,
  getLinks,
  getSavedContacts,
  getOrCreateConversation,
  saveContact,
  exchangeContact,
  getSubscription,
  getProfilePlanFromApi,
  type UserProfile,
  type UserLink,
} from '@/lib/api';

export default function ProfileByIdScreen() {
  const { id, save, exchange } = useLocalSearchParams<{ id: string; save?: string; exchange?: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [links, setLinks] = useState<UserLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadySaved, setIsAlreadySaved] = useState(false);
  const [profileIsPro, setProfileIsPro] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [p, l, sub] = await Promise.all([getProfile(id), getLinks(id), getSubscription(id)]);
      setProfile(p ?? null);
      setLinks(l ?? []);
      let isPro = (sub?.plan as string) === 'pro';
      if (!isPro && p) {
        const planFromApi = await getProfilePlanFromApi(id);
        isPro = planFromApi === 'pro';
      }
      setProfileIsPro(isPro);
      if (!p) setError('Profile not found');
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!user?.id || !profile || profile.userId === user.id) return;
    let cancelled = false;
    getSavedContacts().then((contacts) => {
      if (!cancelled) {
        setIsAlreadySaved(contacts.some((c) => c.contactUserId === profile.userId));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, profile?.userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Auto-save when opened from web "Exchange contact" (save=1) or mutual exchange (exchange=1)
  const autoSaveAttempted = useRef(false);
  useEffect(() => {
    if (save !== '1' || !user?.id || !profile || profile.userId === user.id || isAlreadySaved || autoSaveAttempted.current) return;
    autoSaveAttempted.current = true;
    const doSave = exchange === '1'
      ? exchangeContact(profile.userId, profile.name, profile.avatarUrl ?? undefined)
      : saveContact(profile.userId, profile.name, profile.avatarUrl ?? undefined);
    doSave.then((result) => {
      if (result.success) setIsAlreadySaved(true);
    }).catch(() => {});
  }, [save, exchange, user?.id, profile, isAlreadySaved]);

  const handleSaveContact = useCallback(async () => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      const result = await saveContact(profile.userId, profile.name, profile.avatarUrl ?? undefined);
      if (result.success) {
        setIsAlreadySaved(true);
        Alert.alert('Contact saved!', undefined, [{ text: 'OK' }]);
      } else {
        Alert.alert('Could not save', result.error ?? 'Try again.');
      }
    } catch {
      Alert.alert('Error', 'Could not save contact.');
    } finally {
      setSaving(false);
    }
  }, [user, profile]);

  const handleMessage = useCallback(async () => {
    if (!user || !profile || profile.userId === user.id) return;
    setSaving(true);
    try {
      const conv = await getOrCreateConversation(user.id, profile.userId);
      if (conv) router.push(`/messages/${conv.id}` as const);
      else Alert.alert('Error', 'Could not start conversation.');
    } catch {
      Alert.alert('Error', 'Could not start conversation.');
    } finally {
      setSaving(false);
    }
  }, [user, profile, router]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  }, [router]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Image
          source={require('@/assets/images/loading.gif')}
          style={{ width: 64, height: 64 }}
        />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error ?? 'Profile not found'}</Text>
        <Pressable onPress={handleBack} style={[styles.backBtn, { borderColor: colors.borderLight }]}>
          <Text style={{ color: colors.text }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.borderLight, paddingTop: insets.top + 12, paddingBottom: 12 }]}>
        <Pressable onPress={handleBack} style={styles.headerBack} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          Profile
        </Text>
        <View style={styles.headerBack} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileScanPreview
          profile={profile}
          links={links}
          onSaveContact={user?.id !== profile.userId && !isAlreadySaved ? handleSaveContact : undefined}
          onMessage={user?.id !== profile.userId ? handleMessage : undefined}
          showProRing={profileIsPro}
          showVerified={profileIsPro}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Layout.cardPadding },
  errorText: { marginBottom: Layout.rowGap },
  backBtn: { paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1, borderRadius: Layout.radiusMd },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBack: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 17, fontWeight: '600', flex: 1, textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: Layout.screenPadding, paddingBottom: 40 },
});
