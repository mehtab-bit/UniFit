import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key-here';

/**
 * Universal SSR-safe storage adapter for React Native (iOS, Android) and Web
 */
export const SafeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
        return null;
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
        return;
      }
      await AsyncStorage.setItem(key, value);
    } catch {
      // safe fallback
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
        return;
      }
      await AsyncStorage.removeItem(key);
    } catch {
      // safe fallback
    }
  },
};

/**
 * Validates if actual user-configured Supabase credentials are provided
 * vs default placeholders.
 */
export const isLiveSupabaseConfigured = (): boolean => {
  const isUrlValid =
    Boolean(SUPABASE_URL) &&
    !SUPABASE_URL.includes('your-project-id') &&
    SUPABASE_URL.startsWith('https://');

  const isKeyValid =
    Boolean(SUPABASE_ANON_KEY) &&
    !SUPABASE_ANON_KEY.includes('your-supabase-anon-key') &&
    SUPABASE_ANON_KEY.length > 20;

  return isUrlValid && isKeyValid;
};

/**
 * Official Supabase client initialized with persistent safe storage.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: SafeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const SUPABASE_CONFIG = {
  url: SUPABASE_URL,
  isConfigured: isLiveSupabaseConfigured(),
};
