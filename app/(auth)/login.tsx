import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { Link, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabase/supabaseClient';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const videoRef = useRef<Video>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'password' | 'magic'>('password');

  useEffect(() => {
    videoRef.current?.playAsync().catch(() => {});
  }, []);

  async function signInWithPassword() {
    if (!email.trim()) {
      Alert.alert('Error', 'Enter your email');
      return;
    }
    if (mode === 'password' && !password.trim()) {
      Alert.alert('Error', 'Enter your password');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'magic') {
        const { data, error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: 'ringtap://auth/callback' },
        });
        console.log('LOGIN OTP:', data, error);
        if (error) throw error;
        setMagicLinkSent(true);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        console.log('LOGIN PASSWORD:', data, error);
        if (error) throw error;
        router.replace('/(tabs)');
      }
    } catch (e: unknown) {
      console.log('LOGIN CRASH:', e);
      Alert.alert('Error', e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  const videoBackground = (
    <>
      <Video
        ref={videoRef}
        source={require('../../assets/ringtap.mp4')}
        style={styles.videoBackground}
        resizeMode={ResizeMode.COVER}
        isLooping
        isMuted
        shouldPlay
      />
      <View style={styles.videoOverlay} />
    </>
  );

  if (magicLinkSent) {
    return (
      <View style={styles.screen}>
        {videoBackground}
        <View style={styles.container}>
          <View style={[styles.card, { backgroundColor: colors.surface + 'E6' }]}>
            <Ionicons name="mail-open-outline" size={48} color={colors.accent} />
            <Text style={[styles.title, { color: colors.text }]}>Check your email</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              We sent a magic link to {email}. Tap the link to sign in.
            </Text>
            <Pressable
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={() => { setMagicLinkSent(false); setEmail(''); }}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>Use a different email</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {videoBackground}
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboard}
        >
          <View style={[styles.card, { backgroundColor: colors.surface + 'E6' }]}>
            <Text style={[styles.logo, { color: colors.text }]}>RingTap</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your digital business card</Text>

            <TextInput
              style={[styles.input, { borderColor: colors.borderLight, color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            {mode === 'password' && (
              <TextInput
                style={[styles.input, { borderColor: colors.borderLight, color: colors.text }]}
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />
            )}

            <Pressable
              style={[styles.button, { backgroundColor: colors.accent }, loading && styles.buttonDisabled]}
              onPress={signInWithPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: colors.text }]}>
                  {mode === 'password' ? 'Sign in' : 'Send magic link'}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={styles.linkButton}
              onPress={() => setMode(mode === 'password' ? 'magic' : 'password')}
            >
              <Text style={[styles.linkText, { color: colors.accent }]}>
                {mode === 'password' ? 'Use magic link instead' : 'Use password instead'}
              </Text>
            </Pressable>

            <Link href="/(auth)/signup" asChild>
              <Pressable style={styles.linkButton}>
                <Text style={[styles.linkText, { color: colors.accent }]}>Don't have an account? Sign up</Text>
              </Pressable>
            </Link>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  videoBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 11, 0.65)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Layout.screenPadding,
  },
  keyboard: {
    width: '100%',
  },
  card: {
    alignItems: 'center',
    gap: 16,
    padding: Layout.sectionGap,
    borderRadius: Layout.radiusLg,
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: Layout.body,
    textAlign: 'center',
    marginBottom: Layout.tightGap,
  },
  input: {
    width: '100%',
    height: Layout.inputHeight,
    borderWidth: 1,
    borderRadius: Layout.radiusMd,
    paddingHorizontal: 16,
    fontSize: Layout.body,
  },
  button: {
    width: '100%',
    height: Layout.buttonHeight,
    borderRadius: Layout.radiusMd,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Layout.tightGap,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: Layout.body,
    fontWeight: '600',
  },
  linkButton: {
    padding: Layout.tightGap,
  },
  linkText: {
    fontSize: Layout.bodySmall,
  },
});
