import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
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

import { ThemedView } from '@/components/themed-view';
import { Layout } from '@/constants/theme';
import { useThemeColors } from '@/hooks/useThemeColors';
import { supabase } from '@/lib/supabase/supabaseClient';

export default function LoginScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'password' | 'magic'>('password');

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
        const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
        if (error) throw error;
        setMagicLinkSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        router.replace('/(tabs)');
      }
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  if (magicLinkSent) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.card}>
          <Ionicons name="mail-open-outline" size={48} color={Tokens.accent} />
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a magic link to {email}. Tap the link to sign in.
          </Text>
          <Pressable
            style={styles.button}
            onPress={() => { setMagicLinkSent(false); setEmail(''); }}
          >
            <Text style={styles.buttonText}>Use a different email</Text>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <View style={styles.card}>
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
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
