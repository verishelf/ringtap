import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Image } from 'expo-image';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProfileScanPreview } from '@/components/ProfileScanPreview';
import { SaveContactSheet } from '@/components/SaveContactSheet';
import { Layout } from '@/constants/theme';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
    exchangeContact,
    getLinks,
    getOrCreateConversation,
    getProfile,
    getProfilePlanFromApi,
    getSavedContacts,
    getSubscription,
    saveContact,
    updateContactRelationship,
    type PipelineStage,
    type RelationshipIntelligence,
    type UserLink,
    type UserProfile,
} from '@/lib/api';

const PIPELINE_OPTIONS: { value: PipelineStage; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'lead', label: 'Lead' },
  { value: 'partner', label: 'Partner' },
  { value: 'recruit', label: 'Recruit' },
  { value: 'other', label: 'Other' },
];

export default function ProfileByIdScreen() {
  const { id, save, exchange } = useLocalSearchParams<{ id: string; save?: string; exchange?: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const { isPro: viewerIsPro } = useSubscription();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [links, setLinks] = useState<UserLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAlreadySaved, setIsAlreadySaved] = useState(false);
  const [savedContactId, setSavedContactId] = useState<string | null>(null);
  const [profileIsPro, setProfileIsPro] = useState(false);
  const [saveSheetVisible, setSaveSheetVisible] = useState(false);
  const [savedContact, setSavedContact] = useState<{
    howMet: string | null;
    metAtLocation: string | null;
    metAt: string | null;
    notes: string | null;
    followUpAt: string | null;
    pipelineStage: PipelineStage;
  } | null>(null);

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
        const c = contacts.find((x) => x.contactUserId === profile.userId);
        setIsAlreadySaved(!!c);
        setSavedContactId(c?.id ?? null);
        if (c) {
          setSavedContact({
            howMet: c.howMet,
            metAtLocation: c.metAtLocation,
            metAt: c.metAt,
            notes: c.notes,
            followUpAt: c.followUpAt,
            pipelineStage: c.pipelineStage,
          });
        } else {
          setSavedContact(null);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, profile?.userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
  }, [router]);

  useLayoutEffect(() => {
    const title = loading
      ? 'Profile'
      : error || !profile
        ? 'Profile'
        : (profile.name?.trim() || 'Profile');
    navigation.setOptions({
      title,
      headerBackVisible: false,
      headerLeft: () => (
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => [styles.headerBack, { opacity: pressed ? 0.65 : 1 }]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
      ),
    });
  }, [navigation, loading, error, profile, handleBack, colors.text]);

  // Auto-save when opened from web "Exchange contact" (save=1) or mutual exchange (exchange=1)
  const autoSaveAttempted = useRef(false);
  useEffect(() => {
    if (save !== '1' || !user?.id || !profile || profile.userId === user.id || isAlreadySaved || autoSaveAttempted.current) return;
    autoSaveAttempted.current = true;
    const doSave = exchange === '1'
      ? exchangeContact(profile.userId, profile.name, profile.avatarUrl ?? undefined)
      : saveContact(profile.userId, profile.name, profile.avatarUrl ?? undefined, undefined);
    doSave.then((result) => {
      if (result.success) setIsAlreadySaved(true);
    }).catch(() => {});
  }, [save, exchange, user?.id, profile, isAlreadySaved]);

  const handleSaveContact = useCallback(() => {
    if (!user || !profile) return;
    setSaveSheetVisible(true);
  }, [user, profile]);

  const handleSaveFromSheet = useCallback(
    async (relationship: RelationshipIntelligence) => {
      if (!user || !profile) throw new Error('missing');
      const result = await saveContact(
        profile.userId,
        profile.name,
        profile.avatarUrl ?? undefined,
        relationship
      );
      if (result.success) {
        setIsAlreadySaved(true);
        Alert.alert('Contact saved!', undefined, [{ text: 'OK' }]);
        return;
      }
      Alert.alert('Could not save', result.error ?? 'Try again.');
      throw new Error(result.error ?? 'save failed');
    },
    [user, profile]
  );

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

  const handleSetPipeline = useCallback(
    async (stage: PipelineStage) => {
      if (!savedContactId || !viewerIsPro) return;
      const r = await updateContactRelationship(savedContactId, { pipelineStage: stage });
      if (r.success) setSavedContact((prev) => (prev ? { ...prev, pipelineStage: stage } : prev));
      else Alert.alert('Could not update', r.error ?? 'Try again.');
    },
    [savedContactId, viewerIsPro]
  );

  const handleFollowUpInDays = useCallback(
    async (days: number) => {
      if (!savedContactId || !viewerIsPro) return;
      const d = new Date();
      d.setDate(d.getDate() + days);
      d.setHours(9, 0, 0, 0);
      const iso = d.toISOString();
      const r = await updateContactRelationship(savedContactId, { followUpAt: iso });
      if (r.success) setSavedContact((prev) => (prev ? { ...prev, followUpAt: iso } : prev));
      else Alert.alert('Could not update', r.error ?? 'Try again.');
    },
    [savedContactId, viewerIsPro]
  );

  const handleClearFollowUp = useCallback(async () => {
    if (!savedContactId || !viewerIsPro) return;
    const r = await updateContactRelationship(savedContactId, { followUpAt: null });
    if (r.success) setSavedContact((prev) => (prev ? { ...prev, followUpAt: null } : prev));
    else Alert.alert('Could not update', r.error ?? 'Try again.');
  }, [savedContactId, viewerIsPro]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Image
          source={require('@/assets/images/loading.gif')}
          style={{ width: 64, height: 64 }}
        />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background, paddingBottom: insets.bottom }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error ?? 'Profile not found'}</Text>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Layout.sectionGap, paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'never' : undefined}
      >
        <ProfileScanPreview
          profile={profile}
          links={links}
          onSaveContact={user?.id !== profile.userId && !isAlreadySaved ? handleSaveContact : undefined}
          isAlreadyConnected={user?.id !== profile.userId && isAlreadySaved}
          onMessage={user?.id !== profile.userId ? handleMessage : undefined}
          showProRing={profileIsPro}
          showVerified={profileIsPro}
          relationshipInfo={savedContact}
        />
        {user?.id && profile.userId !== user.id && isAlreadySaved && viewerIsPro && savedContactId ? (
          <View
            style={[
              styles.followUpCard,
              { backgroundColor: colors.surfaceElevated ?? colors.surface, borderColor: colors.borderLight },
            ]}
          >
            <Text style={[styles.followUpTitle, { color: colors.text }]}>Follow-up</Text>
            <Text style={[styles.followUpHint, { color: colors.textSecondary }]}>Pipeline</Text>
            <View style={styles.chipWrap}>
              {PIPELINE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => void handleSetPipeline(opt.value)}
                  style={[
                    styles.chip,
                    {
                      borderColor: colors.borderLight,
                      backgroundColor:
                        savedContact?.pipelineStage === opt.value ? colors.accent + '33' : colors.background,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: colors.text }]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.followUpHint, { color: colors.textSecondary, marginTop: Layout.rowGap }]}>
              Remind me in…
            </Text>
            <View style={styles.chipWrap}>
              {[
                { days: 3, label: '3d' },
                { days: 7, label: '7d' },
                { days: 30, label: '30d' },
              ].map(({ days, label }) => (
                <Pressable
                  key={days}
                  onPress={() => void handleFollowUpInDays(days)}
                  style={[styles.chip, { borderColor: colors.accent, backgroundColor: colors.accent + '18' }]}
                >
                  <Text style={[styles.chipText, { color: colors.accent }]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            {savedContact?.followUpAt ? (
              <Pressable onPress={() => void handleClearFollowUp()} style={{ marginTop: 10 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Clear reminder</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
      <SaveContactSheet
        visible={saveSheetVisible}
        onClose={() => setSaveSheetVisible(false)}
        onSave={handleSaveFromSheet}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Layout.cardPadding },
  errorText: { marginBottom: Layout.rowGap },
  backBtn: { width: 40, padding: 4 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Layout.screenPadding,
  },
  headerBack: { padding: 4, marginLeft: Platform.select({ ios: 4, default: 0 }) },
  followUpCard: {
    marginTop: Layout.sectionGap,
    padding: Layout.cardPadding,
    borderRadius: Layout.radiusLg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  followUpTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  followUpHint: { fontSize: 12, marginBottom: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Layout.radiusPill,
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
});
