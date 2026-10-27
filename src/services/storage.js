import {
  DEFAULT_MASTER_CATALOG,
  INITIAL_CART_ITEMS,
  INITIAL_PAST_SESSIONS,
  DEFAULT_STORES
} from '../data/defaultProducts';
import { syncCartToCloud, fetchCartFromCloud, getFirebaseInstance } from './firebase';
import {
  syncCartToSupabase,
  fetchCartFromSupabase,
  getSupabaseInstance,
  getStoredAuthUser,
  broadcastCartUpdate
} from './supabase';

const KEYS = {
  CART: 'smart_grocery_cart_v1',
  BUDGET: 'smart_grocery_budget_v1',
  STORE: 'smart_grocery_store_v1',
  DATE: 'smart_grocery_date_v1',
  CATALOG: 'smart_grocery_catalog_v1',
  HISTORY: 'smart_grocery_history_v1',
  SETTINGS: 'smart_grocery_settings_v1'
};

/**
 * Format tanggal lokal hari ini (WIB / Local) dalam format YYYY-MM-DD
 */
export function getTodayLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getLocalBudget() {
  const saved = localStorage.getItem(KEYS.BUDGET);
  if (saved !== null) {
    const val = Number(saved);
    if (!isNaN(val) && val > 0) return val;
  }
  return 500000; // Rp 500.000 (Jatah belanja bulanan default)
}

export function saveLocalBudget(amount) {
  const valid = Math.max(0, Number(amount) || 0);
  localStorage.setItem(KEYS.BUDGET, String(valid));
  triggerCloudSync();
  return valid;
}

export function getLocalStore() {
  try {
    const saved = localStorage.getItem(KEYS.STORE);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {
    console.warn('Gagal membaca store dari storage:', e);
  }
  return DEFAULT_STORES[0] || 'Lotte Mart Puri Indah';
}

export function saveLocalStore(storeName) {
  const val = (storeName && storeName.trim()) || 'Lotte Mart Puri Indah';
  localStorage.setItem(KEYS.STORE, val);
  triggerCloudSync();
  return val;
}

export function getLocalDate() {
  try {
    const saved = localStorage.getItem(KEYS.DATE);
    if (saved && saved.trim()) return saved.trim();
  } catch (e) {
    console.warn('Gagal membaca date dari storage:', e);
  }
  return getTodayLocalDateString();
}

export function saveLocalDate(dateString) {
  const val = (dateString && dateString.trim()) || getTodayLocalDateString();
  localStorage.setItem(KEYS.DATE, val);
  triggerCloudSync();
  return val;
}

export function getLocalCart() {
  try {
    const saved = localStorage.getItem(KEYS.CART);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error parsing cart from storage:', e);
  }
  return INITIAL_CART_ITEMS;
}

export function saveLocalCart(items) {
  localStorage.setItem(KEYS.CART, JSON.stringify(items));
  triggerCloudSync();
}

export function getMasterCatalog() {
  try {
    const saved = localStorage.getItem(KEYS.CATALOG);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error parsing catalog:', e);
  }
  return DEFAULT_MASTER_CATALOG;
}

export function saveMasterCatalog(catalog) {
  localStorage.setItem(KEYS.CATALOG, JSON.stringify(catalog));
  triggerCloudSync();
}

export function getPastSessions() {
  try {
    const saved = localStorage.getItem(KEYS.HISTORY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error parsing history:', e);
  }
  return INITIAL_PAST_SESSIONS;
}

export function savePastSessions(sessions) {
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(sessions));
  triggerCloudSync();
}

/**
 * Trigger background sync ke Supabase Cloud (dengan debounce aman)
 */
let debounceTimer = null;
export function triggerCloudSync() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const { isConfigured: isSupabaseConfigured } = getSupabaseInstance();
    if (!isSupabaseConfigured) return;

    try {
      const user = getStoredAuthUser();
      if (!user || !user.uid) return;

      const payload = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        budgetCap: getLocalBudget(),
        store: getLocalStore(),
        date: getLocalDate(),
        cart: getLocalCart(),
        catalog: getMasterCatalog(),
        history: getPastSessions(),
        syncedAt: new Date().toISOString()
      };

      // 1. Sync ke Supabase (Primary)
      await syncCartToSupabase(user.uid, payload);

      // 2. Broadcast instan ke perangkat lain via Supabase Realtime
      await broadcastCartUpdate(user.uid, payload);

      // 3. Optional secondary fallback ke Firebase jika dikonfigurasi
      const { isConfigured: isFirebaseConfigured } = getFirebaseInstance();
      if (isFirebaseConfigured) {
        await syncCartToCloud(user.uid, payload);
      }
    } catch (e) {
      console.warn('Sync cloud background notice:', e.message);
    }
  }, 1000);
}

/**
 * Muat data dari Cloud (Supabase) ke Local Storage saat user login / init
 */
export async function syncUserDataFromCloud(userId) {
  if (!userId) return null;
  try {
    let cloudData = await fetchCartFromSupabase(userId);

    // Optional secondary fallback jika Supabase belum ada data
    if (!cloudData) {
      cloudData = await fetchCartFromCloud(userId);
    }

    if (cloudData) {
      if (cloudData.budgetCap) localStorage.setItem(KEYS.BUDGET, String(cloudData.budgetCap));
      if (cloudData.store) localStorage.setItem(KEYS.STORE, String(cloudData.store));
      if (cloudData.date) localStorage.setItem(KEYS.DATE, String(cloudData.date));
      if (Array.isArray(cloudData.cart)) localStorage.setItem(KEYS.CART, JSON.stringify(cloudData.cart));
      if (Array.isArray(cloudData.catalog)) localStorage.setItem(KEYS.CATALOG, JSON.stringify(cloudData.catalog));
      if (Array.isArray(cloudData.history)) localStorage.setItem(KEYS.HISTORY, JSON.stringify(cloudData.history));
      return cloudData;
    }
  } catch (err) {
    console.warn('Gagal sinkronisasi data cloud user:', err);
  }
  return null;
}

/**
 * Selesai Belanja / Checkout:
 * Mengarsipkan troli saat ini menjadi riwayat resmi dengan toko & tanggal
 */
export function checkoutSession({ title, budgetCap, totalSpent, totalSaved, cartItems, store, date }) {
  const currentStore = store || getLocalStore();
  const currentDate = date || getLocalDate();

  const newSession = {
    id: `session-${Date.now()}`,
    title: title || `Belanja di ${currentStore} - ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`,
    store: currentStore,
    date: currentDate,
    budgetCap,
    totalSpent,
    totalSaved,
    itemsCount: cartItems.length,
    items: cartItems.map(item => ({
      name: item.name,
      category: item.category || 'pokok',
      unit: item.unit || 'pcs',
      qty: item.qty || 1,
      unitPrice: item.unitPrice,
      lastMonthPrice: item.lastMonthPrice,
      discountString: item.discountString,
      store: item.store || currentStore,
      date: item.date || currentDate,
      finalLineTotal: item.lineTotal
    }))
  };

  // Update sessions list
  const currentSessions = getPastSessions();
  const updatedSessions = [newSession, ...currentSessions];
  savePastSessions(updatedSessions);

  // Update master catalog: harga belanja saat ini otomatis menjadi "harga bulan lalu" untuk belanja selanjutnya di toko yang sama
  const catalog = getMasterCatalog();
  const catalogMap = new Map(catalog.map(c => [`${(c.store || '').toLowerCase()}::${c.name.toLowerCase().trim()}`, c]));

  cartItems.forEach(item => {
    const itemStore = item.store || currentStore;
    const key = `${itemStore.toLowerCase()}::${item.name.toLowerCase().trim()}`;
    if (catalogMap.has(key)) {
      const existing = catalogMap.get(key);
      existing.lastMonthPrice = item.unitPrice; // update patokan riwayat
      existing.currentPrice = item.unitPrice;
      existing.store = itemStore;
    } else {
      catalog.push({
        id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: item.name,
        category: item.category || 'lainnya',
        unit: item.unit || 'pcs',
        packSize: 1,
        store: itemStore,
        lastMonthPrice: item.unitPrice,
        currentPrice: item.unitPrice,
        note: `Ditambahkan otomatis dari sesi belanja ${itemStore}`
      });
    }
  });

  saveMasterCatalog(catalog);

  // Kosongkan keranjang belanja aktif
  saveLocalCart([]);

  return newSession;
}

/**
 * Reset seluruh data ke dataset awal
 */
export function resetToDefaults() {
  localStorage.setItem(KEYS.BUDGET, '500000');
  localStorage.setItem(KEYS.STORE, DEFAULT_STORES[0]);
  localStorage.setItem(KEYS.DATE, getTodayLocalDateString());
  localStorage.setItem(KEYS.CART, JSON.stringify(INITIAL_CART_ITEMS));
  localStorage.setItem(KEYS.CATALOG, JSON.stringify(DEFAULT_MASTER_CATALOG));
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(INITIAL_PAST_SESSIONS));
  triggerCloudSync();
}

/**
 * Ekspor seluruh data belanja ke JSON
 */
export function exportAllData() {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    budgetCap: getLocalBudget(),
    store: getLocalStore(),
    date: getLocalDate(),
    cart: getLocalCart(),
    catalog: getMasterCatalog(),
    history: getPastSessions()
  };
}

/**
 * Impor data dari JSON
 */
export function importAllData(data) {
  if (!data || typeof data !== 'object') throw new Error('Data tidak valid');
  if (data.budgetCap) localStorage.setItem(KEYS.BUDGET, String(data.budgetCap));
  if (data.store) localStorage.setItem(KEYS.STORE, String(data.store));
  if (data.date) localStorage.setItem(KEYS.DATE, String(data.date));
  if (Array.isArray(data.cart)) localStorage.setItem(KEYS.CART, JSON.stringify(data.cart));
  if (Array.isArray(data.catalog)) localStorage.setItem(KEYS.CATALOG, JSON.stringify(data.catalog));
  if (Array.isArray(data.history)) localStorage.setItem(KEYS.HISTORY, JSON.stringify(data.history));
  triggerCloudSync();
}

/**
 * Bersihkan data sesi lokal saat ganti akun / logout
 */
export function clearUserDataForAccountSwitch() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  localStorage.removeItem(KEYS.CART);
  localStorage.removeItem(KEYS.BUDGET);
  localStorage.removeItem(KEYS.STORE);
  localStorage.removeItem(KEYS.DATE);
  localStorage.removeItem(KEYS.CATALOG);
  localStorage.removeItem(KEYS.HISTORY);
}
