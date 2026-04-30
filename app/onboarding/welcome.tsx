import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { Link, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const BG = '#FAFAFA';
const TEXT = '#111111';
const SUB = '#5C5C5C';
const ACCENT = '#111111';
/** Pixels the lower sheet overlaps the video so the frame reads behind the card */
const VIDEO_OVERLAP = 40;

export default function OnboardingWelcomeScreen() {
  const router = useRouter();
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    videoRef.current?.playAsync().catch(() => {});
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.split}>
        <View style={styles.videoSection}>
          <Video
            ref={videoRef}
            source={require('../../assets/ringtap.mp4')}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            isLooping
            isMuted
            shouldPlay
          />
        </View>
        <SafeAreaView style={styles.ctaSafe} edges={['bottom']}>
          <View style={styles.ctaSection}>
            <Text style={styles.headline}>Your card, everywhere you go</Text>
            <Text style={styles.subcopy} numberOfLines={3}>
              RingTap is your digital business card—share by NFC, QR, or link. One profile, always up to date.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
              onPress={() => router.push('/onboarding/questionnaire')}
            >
              <Text style={styles.primaryText}>Get started</Text>
            </Pressable>
            <View style={styles.footer}>
              <Text style={styles.footerPrompt}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable hitSlop={8}>
                  <Text style={styles.footerLink}>Sign in</Text>
                </Pressable>
              </Link>
            </View>
            <View style={styles.badgeRow}>
              <Ionicons name="phone-portrait-outline" size={16} color={SUB} />
              <Text style={styles.badgeText}>NFC · QR · Link</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  split: {
    flex: 1,
    flexDirection: 'column',
  },
  /** 70% — flush to top (no top safe-area band above video) */
  videoSection: {
    flex: 7,
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#0a0a0a',
  },
  video: {
    flex: 1,
    width: '100%',
  },
  ctaSafe: {
    flex: 3,
    backgroundColor: BG,
    minHeight: 0,
    marginTop: -VIDEO_OVERLAP,
    zIndex: 1,
    elevation: 4,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  /** 30% — headline, buttons, footer */
  ctaSection: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingTop: 12,
    minHeight: 0,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: TEXT,
    letterSpacing: -0.6,
    lineHeight: 34,
    marginBottom: 8,
  },
  subcopy: {
    fontSize: 14,
    lineHeight: 20,
    color: SUB,
    marginBottom: 12,
  },
  primary: {
    backgroundColor: ACCENT,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: { opacity: 0.85 },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerPrompt: { fontSize: 14, color: SUB },
  footerLink: { fontSize: 14, fontWeight: '600', color: TEXT },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  badgeText: { fontSize: 13, color: SUB, marginLeft: 6 },
});
