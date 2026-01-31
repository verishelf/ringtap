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

export default function SignupScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signUp() {
    if (!email.trim()) {
      Alert.alert('Error', 'Enter your email');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email: email.trim(), password });
      if (error) throw error;
      Alert.alert(
        'Check your email',
        'We sent you a confirmation link. Open it to activate your account, then sign in.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Sign up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <View style={styles.card}>
          <Text style={styles.logo}>RingTap</Text>
          <Text style={styles.subtitle}>Create your account</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Tokens.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Password (min 6 characters)"
            placeholderTextColor={Tokens.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
          />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={signUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Tokens.primary} />
            ) : (
              <Text style={styles.buttonText}>Sign up</Text>
            )}
          </Pressable>

          <Link href="/(auth)/login" asChild>
            <Pressable style={styles.linkButton}>
              <Text style={styles.linkText}>Already have an account? Sign in</Text>
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
  subtitle: {
    fontSize: Layout.body,
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
