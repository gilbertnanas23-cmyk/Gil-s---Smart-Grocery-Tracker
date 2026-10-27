import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'smart_grocery_supabase_config';
const AUTH_STORAGE_KEY = 'smart_grocery_auth_user_v1';

/**
 * Mendapatkan konfigurasi Supabase aktif
 * Prioritas:
 * 1. Environment Variables (.env / Vercel)
 * 2. LocalStorage setting pengguna (jika diubah via menu Pengaturan)
 * 3. Default fallback URL & anon key
 */
const DEFAULT_SUPABASE_URL = 'https://sbilzgcvfotrfqsujlxj.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_4SRCHsMk6bIZr0ctLwgQZQ_ufch3Czl';

export function getSupabaseConfig() {
  // 1. Cek dari custom setting localStorage
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

  // 2. Cek Environment Variables (Vite / Vercel)
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (envUrl && envKey) {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim()
    };
  }

  // 3. Fallback default
  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_KEY
  };
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
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: window.localStorage
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
 * Mendapatkan user yang tersimpan di sesi lokal
 */
export function getStoredAuthUser() {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Gagal membaca sesi user dari storage:', e);
  }
  return null;
}

/**
 * Helper untuk memformat objek user yang seragam
 */
export function formatUserProfile(supabaseUser, profileData = null) {
  if (!supabaseUser) return null;

  const metadata = supabaseUser.user_metadata || {};
  const emailName = (supabaseUser.email || '').split('@')[0];
  const displayName = profileData?.full_name || metadata.full_name || metadata.name || emailName || 'Pengguna';
  const photoURL = profileData?.avatar_url || metadata.avatar_url || metadata.picture || '';
  const provider = supabaseUser.app_metadata?.provider || (supabaseUser.identities?.[0]?.provider) || 'email';

  return {
    uid: supabaseUser.id,
    email: supabaseUser.email,
    displayName: displayName,
    photoURL: photoURL,
    provider: provider,
    loginAt: new Date().toISOString()
  };
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

    // Uji koneksi ringan via getSession()
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
 * Sinkronisasi / Upsert profil pengguna ke tabel public.profiles di database Supabase
 */
export async function syncUserProfileToDatabase(userId, fullName, avatarUrl = '') {
  const { supabase, isConfigured } = getSupabaseInstance();
  if (!isConfigured || !supabase || !userId) return;

  try {
    await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
  } catch (e) {
    console.warn('Sync profile to profiles table fallback notice:', e.message);
  }
}

/**
 * Mengambil profil pengguna dari tabel public.profiles
 */
export async function fetchUserProfile(userId) {
  const { supabase, isConfigured } = getSupabaseInstance();
  if (!isConfigured || !supabase || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  } catch (e) {
    console.warn('Gagal fetch profil user:', e.message);
  }
  return null;
}

/**
 * Memperbarui nama dan profil pengguna
 */
export async function updateUserProfile(userId, { fullName, avatarUrl }) {
  const { supabase, isConfigured } = getSupabaseInstance();
  if (!isConfigured || !supabase) {
    return { success: false, message: 'Supabase belum terkonfigurasi.' };
  }

  try {
    // 1. Update Supabase Auth user metadata
    const { data: authData, error: authErr } = await supabase.auth.updateUser({
      data: {
        full_name: fullName,
        name: fullName,
        ...(avatarUrl !== undefined ? { avatar_url: avatarUrl } : {})
      }
    });

    if (authErr) {
      return { success: false, message: authErr.message };
    }

    // 2. Update tabel public.profiles
    await syncUserProfileToDatabase(userId, fullName, avatarUrl);

    // 3. Update cached auth user
    const current = getStoredAuthUser();
    if (current) {
      current.displayName = fullName;
      if (avatarUrl !== undefined) current.photoURL = avatarUrl;
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(current));
    }

    return { success: true, user: formatUserProfile(authData.user, { full_name: fullName, avatar_url: avatarUrl }) };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Registrasi Akun Baru dengan Email & Password via Supabase Auth
 */
export async function registerWithSupabase(email, password, displayName = '') {
  const { supabase, isConfigured } = getSupabaseInstance();
  if (!isConfigured || !supabase) {
    return { success: false, message: 'Supabase belum terkonfigurasi. Periksa URL dan API Key.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const nameToSave = displayName.trim() || cleanEmail.split('@')[0];

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          name: nameToSave,
          full_name: nameToSave
        },
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      if (
        error.message.includes('already registered') ||
        error.message.includes('User already registered') ||
        error.status === 422
      ) {
        return {
          success: false,
          message: 'Email ini sudah terdaftar. Silakan langsung masuk (login).'
        };
      }
      return { success: false, message: `Gagal mendaftar: ${error.message}` };
    }

    // Cek kasus Supabase mengembalikan user tapi identitas sudah ada (proteksi duplikasi email tanpa konfirmasi)
    if (data?.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return {
        success: false,
        message: 'Email ini sudah terdaftar. Silakan langsung masuk menggunakan kata sandi Anda.'
      };
    }

    if (data?.user) {
      // Sinkronisasi row profil di database
      await syncUserProfileToDatabase(data.user.id, nameToSave);

      const userProfile = formatUserProfile(data.user, { full_name: nameToSave });

      // Jika Supabase membutuhkan konfirmasi email (data.session bernilai null)
      if (!data.session) {
        return {
          success: true,
          requiresEmailConfirmation: true,
          message: 'Pendaftaran berhasil! Tautan konfirmasi telah dikirim ke email Anda. Silakan periksa kotak masuk/spam sebelum masuk.',
          user: userProfile
        };
      }

      // Jika auto-confirm aktif dan langsung login
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
      return {
        success: true,
        requiresEmailConfirmation: false,
        user: userProfile
      };
    }

    return { success: false, message: 'Gagal membuat akun. Silakan coba lagi.' };
  } catch (err) {
    console.error('Supabase register error:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Login dengan Email & Password via Supabase Auth
 */
export async function loginWithSupabase(email, password, rememberMe = true) {
  const { supabase, isConfigured } = getSupabaseInstance();
  if (!isConfigured || !supabase) {
    return { success: false, message: 'Supabase belum terkonfigurasi. Periksa URL dan API Key.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: password
    });

    if (!error && data?.user) {
      // Coba ambil profil database jika ada
      const profile = await fetchUserProfile(data.user.id);
      const userProfile = formatUserProfile(data.user, profile);

      if (rememberMe) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
      }

      return { success: true, user: userProfile };
    }

    if (error) {
      if (
        error.message.includes('Invalid login credentials') ||
        error.status === 400 ||
        error.message.includes('invalid_grant')
      ) {
        return {
          success: false,
          message: 'Email atau kata sandi salah. Silakan periksa kembali atau klik Daftar jika belum memiliki akun.'
        };
      }
      if (error.message.includes('Email not confirmed')) {
        return {
          success: false,
          message: 'Alamat email belum dikonfirmasi. Periksa kotak masuk atau spam email Anda untuk mengaktifkan akun.'
        };
      }
      return { success: false, message: error.message };
    }

    return { success: false, message: 'Akun belum terdaftar. Silakan registrasi terlebih dahulu.' };
  } catch (err) {
    console.error('Supabase login error:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Login Google OAuth 2.0 via Supabase Auth
 */
export async function signInWithSupabaseGoogle() {
  const { supabase, isConfigured } = getSupabaseInstance();
  if (!isConfigured || !supabase) {
    return { success: false, message: 'Supabase belum terkonfigurasi. Periksa pengaturan URL dan API Key.' };
  }

  try {
    // Alamat redirect otomatis sesuai domain aktif (localhost atau domain vercel)
    const redirectUrl = window.location.origin;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account'
        }
      }
    });

    if (error) {
      return { success: false, message: error.message };
    }

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
  if (!isConfigured || !supabase) {
    return { success: false, message: 'Supabase belum terkonfigurasi.' };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: 'Tautan pemulihan kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk atau folder spam.'
    };
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Update kata sandi baru untuk user yang sedang aktif / setelah klik link reset
 */
export async function updateSupabasePassword(newPassword) {
  const { supabase, isConfigured } = getSupabaseInstance();
  if (!isConfigured || !supabase) {
    return { success: false, message: 'Supabase belum terkonfigurasi.' };
  }

  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: 'Kata sandi berhasil diperbarui! Silakan gunakan kata sandi baru Anda.',
      user: data?.user
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Logout pengguna dari Supabase Auth
 */
export async function signOutFromSupabase() {
  const { supabase, isConfigured } = getSupabaseInstance();

  try {
    if (isConfigured && supabase) {
      await supabase.auth.signOut();
    }
  } catch (e) {
    console.warn('Supabase signout warning:', e.message);
  } finally {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return { success: true };
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

/**
 * Listener untuk mendeteksi sesi masuk Supabase (termasuk kembalinya dari Google OAuth & Reset Password)
 */
export function initSupabaseAuthListener(onUserChanged, onPasswordRecovery) {
  const { supabase, isConfigured } = getSupabaseInstance();
  if (!isConfigured || !supabase) {
    onUserChanged(getStoredAuthUser());
    return () => {};
  }

  // Cek sesi awal secara eksplisit saat startup
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) {
      const profile = await fetchUserProfile(session.user.id);
      const userProfile = formatUserProfile(session.user, profile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
      onUserChanged(userProfile);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      onUserChanged(null);
    }
  }).catch((e) => {
    console.warn('Gagal memverifikasi sesi awal:', e);
    onUserChanged(getStoredAuthUser());
  });

  // Pasang listener perubahan status auth
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    // 1. Deteksi alur Password Recovery dari tautan email
    if (event === 'PASSWORD_RECOVERY') {
      if (typeof onPasswordRecovery === 'function') {
        onPasswordRecovery(true);
      }
    }

    // 2. User berhasil masuk / sesi diperbarui
    if (session?.user) {
      const profile = await fetchUserProfile(session.user.id);
      const userProfile = formatUserProfile(session.user, profile);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
      onUserChanged(userProfile);
    } else if (event === 'SIGNED_OUT') {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      onUserChanged(null);
    }
  });

  return () => {
    subscription?.unsubscribe();
  };
}


/**
 * Broadcast event pembaruan troli antar perangkat via Supabase Realtime Channel
 */
export async function broadcastCartUpdate(userId, payload) {
  const { supabase, isConfigured } = getSupabaseInstance();
  if (!isConfigured || !supabase || !userId) return;

  try {
    const channel = supabase.channel(`realtime_grocery_${userId}`);
    await channel.send({
      type: 'broadcast',
      event: 'sync_update',
      payload
    });
  } catch (e) {
    console.warn('Realtime broadcast notice:', e.message);
  }
}

/**
 * Langganan Realtime Multi-Device untuk sinkronisasi belanjaan pengguna aktif (F-06B)
 * Mendengarkan perubahan tabel PostgreSQL (postgres_changes) dan event Broadcast instan
 */
export function subscribeToUserGroceryRealtime(userId, onDataReceived) {
  const { supabase, isConfigured } = getSupabaseInstance();
  if (!isConfigured || !supabase || !userId) return () => {};

  const channelName = `realtime_grocery_${userId}`;
  const channel = supabase.channel(channelName, {
    config: {
      broadcast: { self: false } // Jangan tangkap event dari diri sendiri untuk menghindari loop
    }
  });

  // 1. Tangkap perubahan baris database Postgres realtime (jika publication aktif)
  channel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'grocery_user_data',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      if (payload.new && payload.new.data) {
        onDataReceived(payload.new.data);
      }
    }
  );

  // 2. Tangkap event broadcast instan lintas perangkat (sub-detik <500ms)
  channel.on(
    'broadcast',
    { event: 'sync_update' },
    ({ payload }) => {
      if (payload && payload.userId === userId) {
        onDataReceived(payload);
      }
    }
  );

  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log(`[Supabase Realtime] Multi-device sync aktif untuk user: ${userId}`);
    }
  });

  return () => {
    try {
      supabase.removeChannel(channel);
    } catch (e) {
      console.warn('Remove realtime channel notice:', e.message);
    }
  };
}
