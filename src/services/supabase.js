import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'smart_grocery_supabase_config';

/**
 * Mendapatkan konfigurasi Supabase aktif
 * Prioritas: 1. LocalStorage setting pengguna -> 2. Environment Variables (.env)
 */
const DEFAULT_SUPABASE_URL = 'https://sbilzgcvfotrfqsujlxj.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_4SRCHsMk6bIZr0ctLwgQZQ_ufch3Czl';

export function getSupabaseConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Gagal membaca custom Supabase config:', e);
  }

  const envConfig = {
    url: import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY
  };

  if (envConfig.url && envConfig.anonKey) {
    return envConfig;
  }

  return null;
}

export function saveCustomSupabaseConfig(config) {
  if (!config) {
    localStorage.removeItem(STORAGE_KEY);
    cachedSupabase = null;
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    cachedSupabase = null;
  }
}

let cachedSupabase = null;

export function getSupabaseInstance() {
  const config = getSupabaseConfig();
  if (!config || !config.url || !config.anonKey) {
    return { supabase: null, isConfigured: false };
  }

  try {
    if (!cachedSupabase) {
      cachedSupabase = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      });
    }
    return { supabase: cachedSupabase, isConfigured: true };
  } catch (err) {
    console.error('Supabase initialization error:', err);
    return { supabase: null, isConfigured: false, error: err.message };
  }
}

/**
 * Uji koneksi ke Supabase Project
 */
export async function testSupabaseConnection(urlToTest, keyToTest) {
  try {
    if (!urlToTest || !keyToTest) {
      return { success: false, message: 'Supabase URL dan Anon Key wajib diisi.' };
    }

    const testClient = createClient(urlToTest.trim(), keyToTest.trim(), {
      auth: { persistSession: false }
    });

    // Uji koneksi ringan via getSession() atau ping auth
    const { error } = await testClient.auth.getSession();
    if (error && error.status !== 400 && !error.message.includes('Auth session missing')) {
      return { success: false, message: `Gagal terhubung: ${error.message}` };
    }

    return { success: true, message: 'Berhasil terhubung ke Supabase Project!' };
  } catch (err) {
    return { success: false, message: `Gagal terhubung ke Supabase: ${err.message}` };
  }
}

/**
 * Login / Daftar dengan Email & Password via Supabase Auth
 */
export async function loginWithSupabase(email, password) {
  const { supabase, isConfigured } = getSupabaseInstance();
  if (!isConfigured || !supabase) {
    return { success: false, message: 'Supabase belum terkonfigurasi.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    // 1. Coba Sign In
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password
    });

    if (!error && data?.user) {
      const userProfile = {
        uid: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.name || cleanEmail.split('@')[0],
        photoURL: data.user.user_metadata?.avatar_url || '',
        provider: 'supabase',
        loginAt: new Date().toISOString()
      };
      return { success: true, user: userProfile };
    }

    // 2. Jika user belum ada, coba auto sign up
    if (error && (error.message.includes('Invalid login credentials') || error.status === 400)) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: { name: cleanEmail.split('@')[0] }
        }
      });

      if (!signUpError && signUpData?.user) {
        const userProfile = {
          uid: signUpData.user.id,
          email: signUpData.user.email,
          displayName: cleanEmail.split('@')[0],
          photoURL: '',
          provider: 'supabase',
          loginAt: new Date().toISOString()
        };
        return { success: true, user: userProfile };
      }
    }

    return { success: false, message: error?.message || 'Gagal login via Supabase.' };
  } catch (err) {
    console.error('Supabase login error:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Login Google OAuth via Supabase
 */
export async function signInWithSupabaseGoogle() {
  const { supabase, isConfigured } = getSupabaseInstance();
  if (!isConfigured || !supabase) {
    return { success: false, message: 'Supabase belum terkonfigurasi.' };
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });

    if (error) return { success: false, message: error.message };
    return { success: true, data };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Reset password via email Supabase
 */
export async function resetSupabasePassword(email) {
  const { supabase, isConfigured } = getSupabaseInstance();
  if (!isConfigured || !supabase) return { success: false };

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin
    });
    return { success: !error, error: error?.message };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Sinkronisasi data troli ke tabel Supabase (tabel: 'grocery_user_data')
 */
export async function syncCartToSupabase(userId, payload) {
  const { supabase, isConfigured } = getSupabaseInstance();
  if (!isConfigured || !supabase || !userId) return { synced: false };

  try {
    const { error } = await supabase
      .from('grocery_user_data')
      .upsert({
        user_id: userId,
        data: payload,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.warn('Supabase table sync notice:', error.message);
      return { synced: false, reason: error.message };
    }
    return { synced: true };
  } catch (err) {
    console.warn('Gagal sync ke Supabase:', err.message);
    return { synced: false, reason: err.message };
  }
}

/**
 * Mengambil data troli dari tabel Supabase
 */
export async function fetchCartFromSupabase(userId) {
  const { supabase, isConfigured } = getSupabaseInstance();
  if (!isConfigured || !supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('grocery_user_data')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle();

    if (!error && data?.data) {
      return data.data;
    }
    return null;
  } catch (err) {
    console.warn('Gagal fetch dari Supabase:', err.message);
    return null;
  }
}

const AUTH_STORAGE_KEY = 'smart_grocery_auth_user_v1';

/**
 * Listener untuk mendeteksi sesi masuk Supabase (termasuk kembalinya dari Google OAuth)
 */
export function initSupabaseAuthListener(onUserChanged) {
  const { supabase, isConfigured } = getSupabaseInstance();
  if (!isConfigured || !supabase) return () => {};

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const allowedEmail = localStorage.getItem('smart_grocery_allowed_email') || import.meta.env.VITE_ALLOWED_GOOGLE_EMAIL;
      if (allowedEmail && session.user.email.toLowerCase() !== allowedEmail.toLowerCase()) {
        await supabase.auth.signOut();
        localStorage.removeItem(AUTH_STORAGE_KEY);
        onUserChanged(null);
        return;
      }

      const userProfile = {
        uid: session.user.id,
        email: session.user.email,
        displayName: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email.split('@')[0],
        photoURL: session.user.user_metadata?.avatar_url || '',
        provider: 'supabase',
        loginAt: new Date().toISOString()
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
      onUserChanged(userProfile);
    }
  });

  return () => {
    subscription?.unsubscribe();
  };
}
