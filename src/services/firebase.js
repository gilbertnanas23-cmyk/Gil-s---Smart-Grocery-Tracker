import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

const STORAGE_KEY = 'smart_grocery_firebase_config';

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

let cachedDb = null;
let cachedApp = null;

export function getFirebaseInstance() {
  const config = getFirebaseConfig();
  if (!config || !config.projectId || !config.apiKey) {
    return { app: null, db: null, isConfigured: false };
  }

  try {
    if (!cachedApp) {
      const apps = getApps();
      cachedApp = apps.length > 0 ? getApp() : initializeApp(config);
    }
    if (!cachedDb) {
      cachedDb = getFirestore(cachedApp);
    }
    return { app: cachedApp, db: cachedDb, isConfigured: true };
  } catch (err) {
    console.error('Firebase initialization error:', err);
    return { app: null, db: null, isConfigured: false, error: err.message };
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
    // Coba ping firestore lewat fetch REST API sederhana atau initialize
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
 * Simpan data troli dan preferensi belanja Rian ke Cloud Firestore
 */
export async function syncCartToCloud(userId = 'rian_default', payload) {
  const { db, isConfigured } = getFirebaseInstance();
  if (!isConfigured || !db) return { synced: false, reason: 'Firebase belum dikonfigurasi' };

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
 * Ambil data dari Cloud Firestore
 */
export async function fetchCartFromCloud(userId = 'rian_default') {
  const { db, isConfigured } = getFirebaseInstance();
  if (!isConfigured || !db) return null;

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
