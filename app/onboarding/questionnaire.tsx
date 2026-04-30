import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ONBOARDING_AUTH_LOADING_LABELS,
  ONBOARDING_SUBMIT_LOADING_LABELS,
} from '@/constants/onboardingLoading';
import {
  ONBOARDING_STEPS,
  type OnboardingStepId,
} from '@/constants/onboardingSteps';
import { useRotatingLabel } from '@/hooks/useRotatingLabel';
import { useSession } from '@/hooks/useSession';
import { useSubscription } from '@/hooks/useSubscription';
import { completeOnboarding } from '@/lib/api';
import { hasSeenOnboardingPaywall } from '@/lib/onboardingPaywallSeen';
import { savePendingOnboardingAnswers } from '@/lib/pendingOnboardingAnswers';

const BG = '#FAFAFA';
const TEXT = '#111111';
const SUB = '#5C5C5C';
const BORDER = '#E8E8E8';
const SELECTED = '#111111';
const PILL_BG = '#FFFFFF';

const PILL_STAGGER_MS = 72;
const PILL_FADE_MS = 340;
const PILL_SLIDE_FROM = 12;

type PillAnim = { opacity: Animated.Value; translateY: Animated.Value };

export default function OnboardingQuestionnaireScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useSession();
  const { isPro } = useSubscription();
  const [stepIndex, setStepIndex] = useState(0);
  const [selections, setSelections] = useState<Partial<Record<OnboardingStepId, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const authLoadingLabel = useRotatingLabel(ONBOARDING_AUTH_LOADING_LABELS, 2200, authLoading);
  const submitLoadingLabel = useRotatingLabel(
    ONBOARDING_SUBMIT_LOADING_LABELS,
    2200,
    submitting
  );

  const step = ONBOARDING_STEPS[stepIndex];
  const progress = useMemo(
    () => (stepIndex + 1) / ONBOARDING_STEPS.length,
    [stepIndex]
  );

  const selected = step ? selections[step.id] : undefined;

  const pillAnims: PillAnim[] = useMemo(
    () =>
      ONBOARDING_STEPS[stepIndex].options.map(() => ({
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(PILL_SLIDE_FROM),
      })),
    [stepIndex]
  );

  useEffect(() => {
    if (pillAnims.length === 0) return;

    pillAnims.forEach((a) => {
      a.opacity.setValue(0);
      a.translateY.setValue(PILL_SLIDE_FROM);
    });

    const hapticTimers = pillAnims.map((_, i) =>
      setTimeout(() => {
        Haptics.selectionAsync().catch(() => {});
      }, i * PILL_STAGGER_MS)
    );

    const anim = Animated.stagger(
      PILL_STAGGER_MS,
      pillAnims.map((a) =>
        Animated.parallel([
          Animated.timing(a.opacity, {
            toValue: 1,
            duration: PILL_FADE_MS,
            useNativeDriver: true,
          }),
          Animated.timing(a.translateY, {
            toValue: 0,
            duration: PILL_FADE_MS,
            useNativeDriver: true,
          }),
        ])
      )
    );

    anim.start();

    return () => {
      anim.stop();
      hapticTimers.forEach(clearTimeout);
    };
  }, [stepIndex, pillAnims]);

  const setSelected = useCallback((value: string) => {
    if (!step) return;
    Haptics.selectionAsync().catch(() => {});
    setSelections((prev) => ({ ...prev, [step.id]: value }));
  }, [step]);

  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/onboarding/welcome');
  }, [stepIndex, router]);

  const onContinue = useCallback(async () => {
    if (!step || !selected) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (stepIndex < ONBOARDING_STEPS.length - 1) {
      setStepIndex((i) => i + 1);
      return;
    }
    const merged = { ...selections, [step.id]: selected } as Record<OnboardingStepId, string>;
    const answers = {
      goal: merged.goal ?? '',
      shareMethod: merged.shareMethod ?? '',
      role: merged.role ?? '',
      familiarity: merged.familiarity ?? '',
    };
    if (!user?.id) {
      setSubmitting(true);
      try {
        await savePendingOnboardingAnswers(answers);
        router.replace('/(auth)/signup');
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setSubmitting(true);
    try {
      const result = await completeOnboarding(user.id, answers);
      if (!result.success) {
        Alert.alert('Could not save', result.error ?? 'Try again.');
        return;
      }
      if (isPro) {
        router.replace('/(tabs)/home');
      } else {
        const alreadySawPaywall = await hasSeenOnboardingPaywall(user.id);
        router.replace(alreadySawPaywall ? '/(tabs)/home' : '/onboarding/upsell');
      }
    } finally {
      setSubmitting(false);
    }
  }, [step, selected, user?.id, stepIndex, selections, isPro, router]);

  if (authLoading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top', 'bottom']}>
        <ActivityIndicator size="large" color={TEXT} />
        <Text style={styles.loadingHint}>{authLoadingLabel}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={TEXT} />
        </Pressable>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.subtitle}>{step.subtitle}</Text>
        <View style={styles.options}>
          {step.options.map((opt, i) => {
            const isOn = selected === opt.value;
            const a = pillAnims[i];
            if (!a) return null;
            return (
              <Animated.View
                key={opt.value}
                style={{
                  opacity: a.opacity,
                  transform: [{ translateY: a.translateY }],
                }}
              >
                <Pressable
                  onPress={() => setSelected(opt.value)}
                  style={({ pressed }) => [
                    styles.pill,
                    isOn && styles.pillSelected,
                    pressed && styles.pillPressed,
                  ]}
                >
                  <View style={styles.pillRow}>
                    <Ionicons
                      name={opt.icon}
                      size={22}
                      color={isOn ? SELECTED : SUB}
                    />
                    <Text
                      style={[styles.pillText, isOn && styles.pillTextSelected]}
                      numberOfLines={3}
                    >
                      {opt.label}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          onPress={onContinue}
          disabled={!selected || submitting}
          style={({ pressed }) => [
            styles.continueBtn,
            (!selected || submitting) && styles.continueDisabled,
            pressed && selected && !submitting && styles.continuePressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.continueText}>Continue</Text>
          )}
        </Pressable>
        {submitting ? (
          <Text style={styles.submittingHint} numberOfLines={2}>
            {submitLoadingLabel}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  backBtn: { padding: 8, width: 44 },
  headerSpacer: { width: 44 },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: BORDER,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: SELECTED,
    borderRadius: 2,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: SUB,
    marginBottom: 28,
  },
  options: { gap: 12 },
  pill: {
    backgroundColor: PILL_BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  pillSelected: {
    borderColor: SELECTED,
    borderWidth: 2,
    backgroundColor: '#F3F3F3',
  },
  pillPressed: { opacity: 0.9 },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pillText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 16,
    color: TEXT,
    fontWeight: '500',
  },
  pillTextSelected: { fontWeight: '600' },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
  },
  continueBtn: {
    backgroundColor: SELECTED,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  continueDisabled: { opacity: 0.4 },
  continuePressed: { opacity: 0.88 },
  continueText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  loadingHint: {
    marginTop: 20,
    fontSize: 15,
    lineHeight: 22,
    color: SUB,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  submittingHint: {
    marginTop: 14,
    fontSize: 14,
    lineHeight: 20,
    color: SUB,
    textAlign: 'center',
  },
});
