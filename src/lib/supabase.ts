import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEYS = {
  CUSTOM_URL: 'barbershop_custom_supabase_url',
  CUSTOM_ANON_KEY: 'barbershop_custom_supabase_anon_key',
};

export function getStoredSupabaseCredentials(): { url: string; anonKey: string } {
  try {
    const customUrl = localStorage.getItem(STORAGE_KEYS.CUSTOM_URL) || '';
    const customKey = localStorage.getItem(STORAGE_KEYS.CUSTOM_ANON_KEY) || '';

    if (customUrl && customKey) {
      return { url: customUrl.trim(), anonKey: customKey.trim() };
    }
  } catch (e) {
    console.error('Error reading stored Supabase credentials', e);
  }

  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (
    envUrl &&
    envKey &&
    envUrl !== 'https://your-project.supabase.co' &&
    envKey !== 'your-anon-key'
  ) {
    return { url: envUrl, anonKey: envKey };
  }

  return { url: '', anonKey: '' };
}

export function saveStoredSupabaseCredentials(url: string, anonKey: string) {
  try {
    if (url && anonKey) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_URL, url.trim());
      localStorage.setItem(STORAGE_KEYS.CUSTOM_ANON_KEY, anonKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_URL);
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_ANON_KEY);
    }
  } catch (e) {
    console.error('Error saving stored Supabase credentials', e);
  }
}

export function clearStoredSupabaseCredentials() {
  try {
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_URL);
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_ANON_KEY);
  } catch (e) {
    console.error('Error clearing stored Supabase credentials', e);
  }
}

export function createSupabaseInstance(url: string, anonKey: string): SupabaseClient | null {
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
    return null;
  }
}

// Initial client instance
const initialCreds = getStoredSupabaseCredentials();
export let isSupabaseConfigured = Boolean(initialCreds.url && initialCreds.anonKey);
export let supabase = isSupabaseConfigured
  ? createSupabaseInstance(initialCreds.url, initialCreds.anonKey)
  : null;

export function updateActiveSupabaseClient(url: string, anonKey: string): SupabaseClient | null {
  const newClient = createSupabaseInstance(url, anonKey);
  supabase = newClient;
  isSupabaseConfigured = Boolean(newClient);
  return newClient;
}
