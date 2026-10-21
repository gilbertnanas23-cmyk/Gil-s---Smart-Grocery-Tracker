import {
  DEFAULT_MASTER_CATALOG,
  INITIAL_CART_ITEMS,
  INITIAL_PAST_SESSIONS
} from '../data/defaultProducts';
import { syncCartToCloud, fetchCartFromCloud, getFirebaseInstance, getStoredAuthUser } from './firebase';

const KEYS = {
  CART: 'smart_grocery_cart_v1',
  BUDGET: 'smart_grocery_budget_v1',
  CATALOG: 'smart_grocery_catalog_v1',
  HISTORY: 'smart_grocery_history_v1',
  SETTINGS: 'smart_grocery_settings_v1'
};

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
 * Trigger background sync ke Cloud Firebase Firestore untuk akun single-user yang aktif
 */
let debounceTimer = null;
export function triggerCloudSync() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const { isConfigured } = getFirebaseInstance();
    if (!isConfigured) return;

    try {
      const user = getStoredAuthUser();
      if (!user || !user.uid) return;

      const payload = {
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        budgetCap: getLocalBudget(),
        cart: getLocalCart(),
        catalog: getMasterCatalog(),
        history: getPastSessions(),
        syncedAt: new Date().toISOString()
      };
      await syncCartToCloud(user.uid, payload);
    } catch (e) {
      console.warn('Sync cloud background gagal:', e);
    }
  }, 1200);
}

/**
 * Muat data dari Firestore Cloud ke Local Storage saat user login
 */
export async function syncUserDataFromCloud(userId) {
  if (!userId) return null;
  try {
    const cloudData = await fetchCartFromCloud(userId);
    if (cloudData) {
      if (cloudData.budgetCap) localStorage.setItem(KEYS.BUDGET, String(cloudData.budgetCap));
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
 * Mengarsipkan troli saat ini menjadi riwayat resmi,
 * dan memperbarui harga patokan (master catalog) untuk belanja berikutnya.
 */
export function checkoutSession({ title, budgetCap, totalSpent, totalSaved, cartItems }) {
  const newSession = {
    id: `session-${Date.now()}`,
    title: title || `Belanja Bulanan - ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`,
    date: new Date().toISOString(),
    budgetCap,
    totalSpent,
    totalSaved,
    itemsCount: cartItems.length,
    items: cartItems.map(item => ({
      name: item.name,
      category: item.category,
      unit: item.unit,
      qty: item.qty,
      unitPrice: item.unitPrice,
      lastMonthPrice: item.lastMonthPrice,
      discountString: item.discountString,
      finalLineTotal: item.lineTotal
    }))
  };

  // Update sessions list
  const currentSessions = getPastSessions();
  const updatedSessions = [newSession, ...currentSessions];
  savePastSessions(updatedSessions);

  // Update master catalog: harga belanja saat ini otomatis menjadi "harga bulan lalu" untuk belanja selanjutnya
  const catalog = getMasterCatalog();
  const catalogMap = new Map(catalog.map(c => [c.name.toLowerCase().trim(), c]));

  cartItems.forEach(item => {
    const key = item.name.toLowerCase().trim();
    if (catalogMap.has(key)) {
      const existing = catalogMap.get(key);
      existing.lastMonthPrice = item.unitPrice; // update patokan riwayat
      existing.currentPrice = item.unitPrice;
    } else {
      catalog.push({
        id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: item.name,
        category: item.category || 'lainnya',
        unit: item.unit || 'pcs',
        packSize: 1,
        lastMonthPrice: item.unitPrice,
        currentPrice: item.unitPrice,
        note: 'Ditambahkan otomatis dari sesi belanja'
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
  if (Array.isArray(data.cart)) localStorage.setItem(KEYS.CART, JSON.stringify(data.cart));
  if (Array.isArray(data.catalog)) localStorage.setItem(KEYS.CATALOG, JSON.stringify(data.catalog));
  if (Array.isArray(data.history)) localStorage.setItem(KEYS.HISTORY, JSON.stringify(data.history));
  triggerCloudSync();
}
