import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';

const STORAGE_KEY = 'smart_grocery_firebase_config';
const AUTH_STORAGE_KEY = 'smart_grocery_auth_user_v1';
const ALLOWED_EMAIL_KEY = 'smart_grocery_allowed_email';

/**
 * Mendapatkan konfigurasi Firebase aktif
 * Prioritas: 1. LocalStorage setting pengguna -> 2. Environment Variables (.env)
 */
export function getFirebaseConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Gagal membaca custom Firebase config:', e);
  }

  // Fallback ke import.meta.env
  const envConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
  };

  if (envConfig.projectId && envConfig.apiKey) {
    return envConfig;
  }

  return null;
}

export function saveCustomFirebaseConfig(config) {
  if (!config) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }
}

/**
 * Email pembatas single-user (opsional whitelist)
 * Jika diisi, hanya email Google ini yang diizinkan mengakses aplikasi.
 */
export function getAllowedGoogleEmail() {
  const saved = localStorage.getItem(ALLOWED_EMAIL_KEY);
  if (saved && saved.trim()) return saved.trim().toLowerCase();
  const envEmail = import.meta.env.VITE_ALLOWED_GOOGLE_EMAIL;
  if (envEmail && envEmail.trim()) return envEmail.trim().toLowerCase();
  return '';
}

export function setAllowedGoogleEmail(email) {
  if (!email || !email.trim()) {
    localStorage.removeItem(ALLOWED_EMAIL_KEY);
  } else {
    localStorage.setItem(ALLOWED_EMAIL_KEY, email.trim().toLowerCase());
  }
}

let cachedDb = null;
let cachedApp = null;
let cachedAuth = null;

export function getFirebaseInstance() {
  const config = getFirebaseConfig();
  if (!config || !config.projectId || !config.apiKey) {
    return { app: null, db: null, auth: null, isConfigured: false };
  }

  try {
    if (!cachedApp) {
      const apps = getApps();
      cachedApp = apps.length > 0 ? getApp() : initializeApp(config);
    }
    if (!cachedDb) {
      cachedDb = getFirestore(cachedApp);
    }
    if (!cachedAuth) {
      cachedAuth = getAuth(cachedApp);
    }
    return { app: cachedApp, db: cachedDb, auth: cachedAuth, isConfigured: true };
  } catch (err) {
    console.error('Firebase initialization error:', err);
    return { app: null, db: null, auth: null, isConfigured: false, error: err.message };
  }
}

/**
 * Uji koneksi Firebase Firestore
 */
export async function testFirebaseConnection(configToTest) {
  try {
    if (!configToTest || !configToTest.projectId || !configToTest.apiKey) {
      return { success: false, message: 'API Key dan Project ID wajib diisi.' };
    }
    const testApp = initializeApp(configToTest, `testApp_${Date.now()}`);
    const testDb = getFirestore(testApp);
    const testDoc = doc(testDb, 'connectivity_test', 'ping');
    await setDoc(testDoc, { ping: true, timestamp: new Date().toISOString() });
    return { success: true, message: 'Berhasil terhubung ke Firebase Firestore!' };
  } catch (err) {
    return { success: false, message: `Gagal terhubung: ${err.message}` };
  }
}

/**
 * Mendapatkan user yang tersimpan di sesi lokal
 */
export function getStoredAuthUser() {
  try {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Gagal membaca sesi user:', e);
  }
  return null;
}

/**
 * Login dengan Email dan Password (mendukung Remember Me)
 */
export async function loginWithEmailAndPassword(email, password, rememberMe = true) {
  if (!email || !email.trim()) {
    return { success: false, message: 'Masukkan Email ID Anda.' };
  }
  if (!password) {
    return { success: false, message: 'Masukkan Password Anda.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // Validasi whitelist email jika ada
  const allowedEmail = getAllowedGoogleEmail();
  if (allowedEmail && cleanEmail !== allowedEmail.toLowerCase()) {
    return {
      success: false,
      message: `Akses ditolak: Akun ${cleanEmail} tidak diizinkan masuk.`
    };
  }

  const { auth, isConfigured } = getFirebaseInstance();
  if (isConfigured && auth) {
    try {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = res.user;
      const userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || cleanEmail.split('@')[0],
        photoURL: user.photoURL || '',
        isDemo: false,
        loginAt: new Date().toISOString()
      };
      if (rememberMe) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
      }
      return { success: true, user: userProfile };
    } catch (err) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          const newRes = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          const newUser = newRes.user;
          const userProfile = {
            uid: newUser.uid,
            email: newUser.email,
            displayName: cleanEmail.split('@')[0],
            photoURL: '',
            isDemo: false,
            loginAt: new Date().toISOString()
          };
          if (rememberMe) {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
          } else {
            sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
          }
          return { success: true, user: userProfile };
        } catch (createErr) {
          console.warn('Firebase email auth fallback:', createErr);
        }
      }
    }
  }

  // Sesi akun lokal / offline
  const namePart = cleanEmail.split('@')[0];
  const formattedName = namePart
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  const userProfile = {
    uid: `user_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
    email: cleanEmail,
    displayName: formattedName,
    photoURL: '',
    isDemo: false,
    loginAt: new Date().toISOString()
  };

  if (rememberMe) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
  } else {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
  }
  return { success: true, user: userProfile };
}

/**
 * Login dengan Google OAuth via Firebase Authentication Popup
 */
export async function signInWithGoogle() {
  const { auth, isConfigured } = getFirebaseInstance();
  if (!isConfigured || !auth) {
    return {
      success: false,
      needConfig: true,
      message: 'Firebase belum terkonfigurasi. Silakan masukkan kredensial Firebase atau gunakan Mode Uji Coba Akun Google.'
    };
  }

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Validasi pembatasan single user jika ada whitelist
    const allowedEmail = getAllowedGoogleEmail();
    if (allowedEmail && user.email.toLowerCase() !== allowedEmail.toLowerCase()) {
      await signOut(auth);
      return {
        success: false,
        message: `Akses ditolak: Aplikasi ini dikonfigurasi khusus untuk single-user (${allowedEmail}). Akun ${user.email} tidak diizinkan masuk.`
      };
    }

    const userProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email.split('@')[0],
      photoURL: user.photoURL || '',
      isDemo: false,
      loginAt: new Date().toISOString()
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
    return { success: true, user: userProfile };
  } catch (err) {
    console.error('Firebase Google Sign-In error:', err);
    let message = `Gagal masuk dengan Google: ${err.message}`;
    if (err.code === 'auth/popup-closed-by-user') {
      message = 'Jendela login Google ditutup sebelum autentikasi selesai.';
    } else if (err.code === 'auth/unauthorized-domain') {
      message = 'Domain ini belum diizinkan di Firebase Console > Authentication > Settings > Authorized domains.';
    } else if (err.code === 'auth/operation-not-allowed') {
      message = 'Provider Google belum diaktifkan di Firebase Console > Authentication > Sign-in method.';
    } else if (err.code === 'auth/network-request-failed') {
      message = 'Koneksi jaringan terputus. Periksa sambungan internet Anda.';
    }
    return { success: false, message, code: err.code };
  }
}

/**
 * Login Simulasi/Uji Coba dengan Email Google
 * Berguna untuk testing lokal, offline, atau sebelum OAuth client ID Firebase siap
 */
export async function signInDemoGoogle(customEmail) {
  const email = (customEmail && customEmail.trim()) || 'gilbert.nanas23@gmail.com';
  
  if (!email.includes('@')) {
    return { success: false, message: 'Format email tidak valid. Masukkan email Google (contoh: nama@gmail.com).' };
  }

  // Validasi pembatasan single user jika ada whitelist
  const allowedEmail = getAllowedGoogleEmail();
  if (allowedEmail && email.toLowerCase() !== allowedEmail.toLowerCase()) {
    return {
      success: false,
      message: `Akses ditolak: Aplikasi ini dikonfigurasi khusus untuk single-user (${allowedEmail}). Email ${email} tidak diizinkan.`
    };
  }

  const namePart = email.split('@')[0];
  const formattedName = namePart
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  const userProfile = {
    uid: `google_single_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
    email: email.toLowerCase(),
    displayName: formattedName,
    photoURL: '',
    isDemo: true,
    loginAt: new Date().toISOString()
  };

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userProfile));
  return { success: true, user: userProfile };
}

/**
 * Logout pengguna
 */
export async function signOutUser() {
  const { auth } = getFirebaseInstance();
  if (auth) {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signout error:', e);
    }
  }
  localStorage.removeItem(AUTH_STORAGE_KEY);
  return { success: true };
}

/**
 * Observer listener untuk perubahan auth state
 */
export function initAuthListener(onUserChanged) {
  const { auth, isConfigured } = getFirebaseInstance();
  if (isConfigured && auth) {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        const allowedEmail = getAllowedGoogleEmail();
        if (allowedEmail && user.email.toLowerCase() !== allowedEmail.toLowerCase()) {
          signOut(auth);
          localStorage.removeItem(AUTH_STORAGE_KEY);
          onUserChanged(null);
          return;
        }

        const profile = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          photoURL: user.photoURL || '',
          isDemo: false,
          loginAt: new Date().toISOString()
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        onUserChanged(profile);
      } else {
        // Jika sebelumnya bukan demo user, maka kosongkan
        const current = getStoredAuthUser();
        if (!current || !current.isDemo) {
          localStorage.removeItem(AUTH_STORAGE_KEY);
          onUserChanged(null);
        }
      }
    });
  }

  // Jika tidak terhubung ke live firebase auth, gunakan stored session
  const stored = getStoredAuthUser();
  onUserChanged(stored);
  return () => {};
}

/**
 * Simpan data troli dan preferensi belanja single-user ke Cloud Firestore
 */
export async function syncCartToCloud(userId, payload) {
  const { db, isConfigured } = getFirebaseInstance();
  if (!isConfigured || !db) return { synced: false, reason: 'Firebase belum dikonfigurasi' };
  if (!userId) return { synced: false, reason: 'User ID tidak tersedia' };

  try {
    const userDoc = doc(db, 'grocery_users', userId);
    await setDoc(userDoc, {
      ...payload,
      lastUpdated: new Date().toISOString()
    }, { merge: true });
    return { synced: true };
  } catch (err) {
    console.error('Gagal sinkronisasi Firestore:', err);
    return { synced: false, reason: err.message };
  }
}

/**
 * Ambil data belanja single-user dari Cloud Firestore
 */
export async function fetchCartFromCloud(userId) {
  const { db, isConfigured } = getFirebaseInstance();
  if (!isConfigured || !db || !userId) return null;

  try {
    const userDoc = doc(db, 'grocery_users', userId);
    const snap = await getDoc(userDoc);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.warn('Gagal membaca data dari cloud:', err);
    return null;
  }
}
