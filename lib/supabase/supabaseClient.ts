import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';

const extra = Constants.expoConfig?.extra as { supabaseUrl?: string; supabaseAnonKey?: string } | undefined;
export const supabaseUrl = extra?.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
export const supabaseAnonKey = extra?.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-key';

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    const value = await SecureStore.getItemAsync(key);
    return value;
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
