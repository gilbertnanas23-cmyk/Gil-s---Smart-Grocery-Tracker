import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  ShoppingCart,
  CheckCircle,
  Sparkles,
  Filter,
  RefreshCw,
  ShoppingBag,
  ShieldCheck,
  User,
  History,
  Lock,
  MapPin,
  Calendar,
  Trash2
} from 'lucide-react';
import { Header } from './components/Header';
import { BudgetSafetyGauge } from './components/BudgetSafetyGauge';
import { GroceryItemCard } from './components/GroceryItemCard';
import { AddItemModal } from './components/AddItemModal';
import { DiscountCalculatorModal } from './components/DiscountCalculatorModal';
import { CheckoutModal } from './components/CheckoutModal';
import { HistoryView } from './components/HistoryView';
import { BudgetAnalyticsView } from './components/BudgetAnalyticsView';
import { SettingsModal } from './components/SettingsModal';
import { LoginView } from './components/LoginView';
import { ProfileModal } from './components/ProfileModal';
import { BottomNav } from './components/BottomNav';
import { BudgetExceededModal } from './components/BudgetExceededModal';
import { ClearCartModal } from './components/ClearCartModal';
import { AddStoreModal } from './components/AddStoreModal';
import {
  INITIAL_CART_ITEMS,
  DEFAULT_MASTER_CATALOG,
  INITIAL_PAST_SESSIONS,
  DEFAULT_STORES
} from './data/defaultProducts';
import {
  getLocalCart,
  saveLocalCart,
  getLocalBudget,
  saveLocalBudget,
  getLocalStore,
  saveLocalStore,
  getLocalCustomStores,
  addLocalCustomStore,
  getLocalDate,
  saveLocalDate,
  getMasterCatalog,
  saveMasterCatalog,
  getPastSessions,
  savePastSessions,
  checkoutSession,
  triggerCloudSync,
  syncUserDataFromCloud,
  clearUserDataForAccountSwitch,
  getLocalTheme,
  saveLocalTheme
} from './services/storage';
import {
  getSupabaseInstance,
  getStoredAuthUser,
  initSupabaseAuthListener,
  signOutFromSupabase,
  subscribeToUserGroceryRealtime
} from './services/supabase';
import { calculateTieredDiscount, calculateBudgetStatus } from './utils/calculations';
import { formatRupiah, formatDateLong } from './utils/formatters';
import { useToast, ToastContainer } from './context/ToastContext';

export function App() {
  const toast = useToast();

  // Authentication state
  const [currentUser, setCurrentUser] = useState(() => getStoredAuthUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset-password'
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [pendingProtectedAction, setPendingProtectedAction] = useState(null); // 'checkout' | 'history'
  const [oauthErrorNotice, setOauthErrorNotice] = useState('');

  // Main application states (F-01, F-05, F-06A)
  const [cart, setCart] = useState(() => getLocalCart());
  const [budgetCap, setBudgetCap] = useState(() => getLocalBudget());
  const [selectedStore, setSelectedStore] = useState(() => getLocalStore());
  const [customStores, setCustomStores] = useState(() => getLocalCustomStores(currentUser?.uid || 'guest'));
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => getLocalDate());
  const mainDateInputRef = useRef(null);
  const prevBudgetStatusRef = useRef(null);
  const isBudgetInitialMountRef = useRef(true);
  const isRemoteSyncingRef = useRef(false);
  const [catalog, setCatalog] = useState(() => getMasterCatalog());
  const [sessions, setSessions] = useState(() => getPastSessions());
  const [activeTab, setActiveTab] = useState('cart'); // 'cart' | 'promo' | 'history' | 'analytics'
  const [theme, setTheme] = useState(() => getLocalTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    saveLocalTheme(next);
    if (currentUser && currentUser.uid) {
      triggerCloudSync();
    }
  };

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [investigatingProduct, setInvestigatingProduct] = useState(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Task B1 & B4: Budget Protection & Clear Cart Modals
  const [isBudgetExceededModalOpen, setIsBudgetExceededModalOpen] = useState(false);
  const [pendingBudgetAction, setPendingBudgetAction] = useState(null); // { execute: Function, projectedTotal: number }
  const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);
  const [isClearingCart, setIsClearingCart] = useState(false);

  // Supabase connection status
  const [supabaseStatus, setSupabaseStatus] = useState(() => {
    const { isConfigured } = getSupabaseInstance();
    return isConfigured;
  });

  // Check URL hash for OAuth errors or password reset recovery
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;

      // 1. Password reset flow: #type=recovery
      if (hash.includes('type=recovery')) {
        setAuthModalMode('reset-password');
        setIsAuthModalOpen(true);
      }

      // 2. OAuth error flow: #error=...
      if (hash.includes('error=')) {
        const params = new URLSearchParams(hash.substring(1));
        const errorDesc = params.get('error_description') || params.get('error') || 'Proses otentikasi Google dibatalkan atau gagal.';
        setOauthErrorNotice(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  // Listen to Supabase Auth State changes on mount
  useEffect(() => {
    const handleUserUpdate = (user) => {
      setCurrentUser(user);

      if (user && user.uid) {
        // Coba sinkronisasi data awal dari Supabase cloud
        syncUserDataFromCloud(user.uid).then((cloudData) => {
          if (cloudData) {
            isRemoteSyncingRef.current = true;
            if (Array.isArray(cloudData.cart)) setCart(cloudData.cart);
            if (cloudData.budgetCap) setBudgetCap(Number(cloudData.budgetCap));
            if (cloudData.store) setSelectedStore(cloudData.store);
            if (cloudData.date) setSelectedDate(cloudData.date);
            if (Array.isArray(cloudData.catalog)) setCatalog(cloudData.catalog);
            if (Array.isArray(cloudData.history)) setSessions(cloudData.history);
            if (Array.isArray(cloudData.customStores)) {
              setCustomStores(cloudData.customStores);
            } else {
              setCustomStores(getLocalCustomStores(user.uid));
            }
            if (cloudData.theme && (cloudData.theme === 'light' || cloudData.theme === 'dark')) {
              setTheme(cloudData.theme);
            }

            const restoredCart = Array.isArray(cloudData.cart) ? cloudData.cart : cart;
            const restoredCap = cloudData.budgetCap ? Number(cloudData.budgetCap) : budgetCap;
            const restoredTotal = restoredCart.reduce((sum, item) => {
              const disc = calculateTieredDiscount(item.unitPrice, item.discountString);
              return sum + (disc.finalPrice * (Number(item.qty) || 1));
            }, 0);
            prevBudgetStatusRef.current = calculateBudgetStatus(restoredTotal, restoredCap).status;
          } else {
            setCustomStores(getLocalCustomStores(user.uid));
          }
        });
      } else {
        setCustomStores(getLocalCustomStores('guest'));
      }
    };

    const handlePasswordRecovery = () => {
      setAuthModalMode('reset-password');
      setIsAuthModalOpen(true);
    };

    const unsubSupabase = initSupabaseAuthListener(handleUserUpdate, handlePasswordRecovery);

    return () => {
      if (typeof unsubSupabase === 'function') unsubSupabase();
    };
  }, []);

  // F-06B: Supabase Realtime Multi-Device Synchronization Listener
  useEffect(() => {
    if (!currentUser || !currentUser.uid) return;

    const unsubscribeRealtime = subscribeToUserGroceryRealtime(currentUser.uid, (cloudData) => {
      if (!cloudData) return;

      isRemoteSyncingRef.current = true;
      if (Array.isArray(cloudData.cart)) {
        setCart(cloudData.cart);
        localStorage.setItem('smart_grocery_cart_v1', JSON.stringify(cloudData.cart));
      }
      if (cloudData.budgetCap && !isNaN(Number(cloudData.budgetCap))) {
        setBudgetCap(Number(cloudData.budgetCap));
        localStorage.setItem('smart_grocery_budget_v1', String(cloudData.budgetCap));
      }
      if (cloudData.store) {
        setSelectedStore(cloudData.store);
        localStorage.setItem('smart_grocery_store_v1', String(cloudData.store));
      }
      if (cloudData.date) {
        setSelectedDate(cloudData.date);
        localStorage.setItem('smart_grocery_date_v1', String(cloudData.date));
      }
      if (Array.isArray(cloudData.catalog)) {
        setCatalog(cloudData.catalog);
        localStorage.setItem('smart_grocery_catalog_v1', JSON.stringify(cloudData.catalog));
      }
      if (Array.isArray(cloudData.history)) {
        setSessions(cloudData.history);
        localStorage.setItem('smart_grocery_history_v1', JSON.stringify(cloudData.history));
      }
      if (Array.isArray(cloudData.customStores)) {
        setCustomStores(cloudData.customStores);
        saveLocalCustomStores(cloudData.customStores, currentUser.uid);
      }
      if (cloudData.theme && (cloudData.theme === 'light' || cloudData.theme === 'dark')) {
        setTheme(cloudData.theme);
        saveLocalTheme(cloudData.theme);
      }
    });

    return () => {
      if (typeof unsubscribeRealtime === 'function') unsubscribeRealtime();
    };
  }, [currentUser]);

  // Update supabase connection status when settings modal toggles
  useEffect(() => {
    const { isConfigured } = getSupabaseInstance();
    setSupabaseStatus(isConfigured);
  }, [isSettingsModalOpen]);

  // Handle successful login & restore account progress
  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);

    if (user && user.uid) {
      const cloudData = await syncUserDataFromCloud(user.uid);
      if (cloudData) {
        if (Array.isArray(cloudData.cart)) setCart(cloudData.cart);
        if (cloudData.budgetCap) setBudgetCap(Number(cloudData.budgetCap));
        if (cloudData.store) setSelectedStore(cloudData.store);
        if (cloudData.date) setSelectedDate(cloudData.date);
        if (Array.isArray(cloudData.catalog)) setCatalog(cloudData.catalog);
        if (Array.isArray(cloudData.history)) setSessions(cloudData.history);
        if (Array.isArray(cloudData.customStores)) {
          setCustomStores(cloudData.customStores);
        } else {
          setCustomStores(getLocalCustomStores(user.uid));
        }
        if (cloudData.theme && (cloudData.theme === 'light' || cloudData.theme === 'dark')) {
          setTheme(cloudData.theme);
        }

        // Pre-seed prevBudgetStatusRef with restored cloud status to prevent false alerts
        const restoredCart = Array.isArray(cloudData.cart) ? cloudData.cart : cart;
        const restoredCap = cloudData.budgetCap ? Number(cloudData.budgetCap) : budgetCap;
        const restoredTotal = restoredCart.reduce((sum, item) => {
          const disc = calculateTieredDiscount(item.unitPrice, item.discountString);
          return sum + (disc.finalPrice * (Number(item.qty) || 1));
        }, 0);
        prevBudgetStatusRef.current = calculateBudgetStatus(restoredTotal, restoredCap).status;
      } else {
        setCustomStores(getLocalCustomStores(user.uid));
      }
    }

    if (pendingProtectedAction === 'checkout') {
      setIsCheckoutModalOpen(true);
      setPendingProtectedAction(null);
    } else if (pendingProtectedAction === 'history') {
      setActiveTab('history');
      setPendingProtectedAction(null);
    }
  };

  // Handle user logout & clean account switch
  const handleLogout = async () => {
    prevBudgetStatusRef.current = 'SAFE';
    triggerCloudSync();
    const loggingOutUid = currentUser?.uid;
    await signOutFromSupabase();
    clearUserDataForAccountSwitch(loggingOutUid);
    setCart(INITIAL_CART_ITEMS);
    setBudgetCap(500000);
    setSelectedStore(DEFAULT_STORES[0]);
    setCustomStores(getLocalCustomStores('guest'));
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setCatalog(DEFAULT_MASTER_CATALOG);
    setSessions(INITIAL_PAST_SESSIONS);
    setCurrentUser(null);
    setIsProfileModalOpen(false);
  };

  // Calculate cart items with net line totals
  const enrichedCart = cart.map((item) => {
    const disc = calculateTieredDiscount(item.unitPrice, item.discountString);
    const netUnitPrice = disc.finalPrice;
    const qty = Number(item.qty) || 1;
    const lineTotal = netUnitPrice * qty;
    return {
      ...item,
      netUnitPrice,
      lineTotal
    };
  });

  const totalCart = enrichedCart.reduce((sum, item) => sum + (item.lineTotal || 0), 0);

  // Real-time budget warning notification monitor (Task 3)
  useEffect(() => {
    if (!budgetCap || budgetCap <= 0) return;

    const budgetInfo = calculateBudgetStatus(totalCart, budgetCap);
    const currentStatus = budgetInfo.status; // 'SAFE' | 'WARNING' | 'OVERBUDGET'

    // Skip on initial mount / page load or remote cloud sync to avoid spurious toast
    if (isBudgetInitialMountRef.current || isRemoteSyncingRef.current) {
      isBudgetInitialMountRef.current = false;
      isRemoteSyncingRef.current = false;
      prevBudgetStatusRef.current = currentStatus;
      return;
    }

    const prevStatus = prevBudgetStatusRef.current;

    // Check meaningful transitions:
    // 1. Normal (SAFE) -> Yellow (WARNING)
    if (prevStatus === 'SAFE' && currentStatus === 'WARNING') {
      toast.warning(
        `Belanja telah mencapai ${budgetInfo.percentage}% dari batas uang saku. Sisa ${formatRupiah(budgetInfo.remaining)}.`,
        5000,
        'Peringatan Anggaran'
      );
    }
    // 2. Normal (SAFE) -> Red (OVERBUDGET) or Yellow (WARNING) -> Red (OVERBUDGET)
    else if ((prevStatus === 'SAFE' || prevStatus === 'WARNING') && currentStatus === 'OVERBUDGET') {
      const overAmount = Math.abs(budgetInfo.remaining);
      toast.error(
        `Total belanja melebihi batas uang saku sebesar ${formatRupiah(overAmount)}.`,
        8000,
        'Batas Anggaran Terlampaui!'
      );
    }

    prevBudgetStatusRef.current = currentStatus;
  }, [totalCart, budgetCap]);

  // Sync cart changes to storage
  const updateCartAndSave = (newCart) => {
    setCart(newCart);
    saveLocalCart(newCart);
  };

  // Helper to calculate total for any items array (Task B1)
  const calculateCartTotal = (items) => {
    return items.reduce((sum, item) => {
      const disc = calculateTieredDiscount(item.unitPrice, item.discountString);
      return sum + (disc.finalPrice * (Number(item.qty) || 1));
    }, 0);
  };

  // Quantity Stepper (F-02 & Task B1)
  const executeUpdateQty = (itemId, newQty) => {
    const safeQty = Math.max(1, newQty);
    const updated = cart.map((i) => {
      if (i.id === itemId) {
        return { ...i, qty: safeQty };
      }
      return i;
    });
    updateCartAndSave(updated);
  };

  const handleUpdateQty = (itemId, newQty) => {
    const currentItem = cart.find((i) => i.id === itemId);
    const safeQty = Math.max(1, newQty);

    // If decreasing or unchanged, no budget check needed
    if (!currentItem || safeQty <= currentItem.qty) {
      executeUpdateQty(itemId, newQty);
      return;
    }

    const updated = cart.map((i) => (i.id === itemId ? { ...i, qty: safeQty } : i));
    const projected = calculateCartTotal(updated);

    if (budgetCap > 0 && projected > budgetCap && projected > totalCart) {
      setPendingBudgetAction({
        execute: () => executeUpdateQty(itemId, newQty),
        projectedTotal: projected
      });
      setIsBudgetExceededModalOpen(true);
    } else {
      executeUpdateQty(itemId, newQty);
    }
  };

  // Delete item
  const handleDeleteItem = (itemId) => {
    const item = cart.find((i) => i.id === itemId);
    const updated = cart.filter((i) => i.id !== itemId);
    updateCartAndSave(updated);
    if (item) {
      toast.success(`${item.name} berhasil dihapus dari troli.`, 2000);
    }
  };

  // Add / Edit item (Task B1 Budget Protection)
  const executeSaveItem = (dataWithStoreAndDate, isEditing) => {
    if (isEditing) {
      const updated = cart.map((item) => (item.id === dataWithStoreAndDate.id ? dataWithStoreAndDate : item));
      updateCartAndSave(updated);
      setEditingItem(null);
    } else {
      const updated = [dataWithStoreAndDate, ...cart];
      updateCartAndSave(updated);

      // Priority handling: Prioritize budget warnings and suppress routine success toast if crossing warning/danger threshold
      const projected = calculateCartTotal(updated);
      const projectedStatus = calculateBudgetStatus(projected, budgetCap).status;
      const currentStatus = calculateBudgetStatus(totalCart, budgetCap).status;

      const willTriggerBudgetWarning =
        (currentStatus === 'SAFE' && projectedStatus === 'WARNING') ||
        ((currentStatus === 'SAFE' || currentStatus === 'WARNING') && projectedStatus === 'OVERBUDGET');

      if (!willTriggerBudgetWarning) {
        toast.success(`${dataWithStoreAndDate.name} berhasil ditambahkan ke troli.`, 2000);
      }
    }
  };

  const handleSaveItem = (itemData) => {
    const dataWithStoreAndDate = {
      ...itemData,
      store: itemData.store || selectedStore,
      date: itemData.date || selectedDate
    };

    const isEditing = Boolean(editingItem);
    const updatedCart = isEditing
      ? cart.map((item) => (item.id === dataWithStoreAndDate.id ? dataWithStoreAndDate : item))
      : [dataWithStoreAndDate, ...cart];

    const projected = calculateCartTotal(updatedCart);

    if (budgetCap > 0 && projected > budgetCap && projected > totalCart) {
      setPendingBudgetAction({
        execute: () => executeSaveItem(dataWithStoreAndDate, isEditing),
        projectedTotal: projected
      });
      setIsBudgetExceededModalOpen(true);
    } else {
      executeSaveItem(dataWithStoreAndDate, isEditing);
    }
  };

  // Task B1: Budget Exceeded Confirmation Handlers
  const handleConfirmBudgetExceeded = () => {
    if (pendingBudgetAction && typeof pendingBudgetAction.execute === 'function') {
      pendingBudgetAction.execute();
    }
    setIsBudgetExceededModalOpen(false);
    setPendingBudgetAction(null);
  };

  const handleCancelBudgetExceeded = () => {
    setIsBudgetExceededModalOpen(false);
    setPendingBudgetAction(null);
  };

  // Task B4: Clear All Cart Items Handler
  const handleConfirmClearCart = async () => {
    setIsClearingCart(true);
    try {
      updateCartAndSave([]);
      if (currentUser && currentUser.uid) {
        await triggerCloudSync();
      }
    } catch (err) {
      console.error('Error clearing cart:', err);
      toast.error('Gagal mengosongkan troli belanja.');
    } finally {
      setIsClearingCart(false);
      setIsClearCartModalOpen(false);
    }
  };

  // Update budget cap (F-05)
  const handleUpdateBudget = (newCap) => {
    setBudgetCap(newCap);
    saveLocalBudget(newCap);
  };

  // All stores including custom stores added by user
  const allStores = [...DEFAULT_STORES, ...customStores];

  // Update active store
  const handleStoreChange = (newStore) => {
    if (newStore !== selectedStore) {
      setSelectedStore(newStore);
      saveLocalStore(newStore);
    }
  };

  // Add new store directly from dashboard
  const handleAddNewStore = (newStoreName) => {
    const trimmed = (newStoreName || '').trim();
    if (!trimmed) return;
    const activeUid = currentUser?.uid || 'guest';
    const added = addLocalCustomStore(trimmed, activeUid);
    if (added) {
      setCustomStores(getLocalCustomStores(activeUid));
    }
    setSelectedStore(trimmed);
    saveLocalStore(trimmed);
  };

  // Update active date
  const handleDateChange = (newDate) => {
    if (newDate !== selectedDate) {
      setSelectedDate(newDate);
      saveLocalDate(newDate);
    }
  };

  const handleOpenMainDatePicker = () => {
    if (mainDateInputRef.current) {
      if (typeof mainDateInputRef.current.showPicker === 'function') {
        try {
          mainDateInputRef.current.showPicker();
        } catch {
          mainDateInputRef.current.focus();
        }
      } else {
        mainDateInputRef.current.focus();
      }
    }
  };

  // Checkout complete
  const handleFinishShopping = ({ title, budgetCap, totalSpent, totalSaved, cartItems }) => {
    const newSession = checkoutSession({
      title,
      budgetCap,
      totalSpent,
      totalSaved,
      cartItems: enrichedCart,
      store: selectedStore,
      date: selectedDate
    });
    setCart([]);
    setSessions(getPastSessions());
    setCatalog(getMasterCatalog());
    setActiveTab('history');
  };

  // Protected: Attempt to checkout
  const handleAttemptCheckout = () => {
    if (!currentUser) {
      setPendingProtectedAction('checkout');
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  // Protected: Tab selection
  const handleSelectTab = (tabId) => {
    if (tabId === 'history' && !currentUser) {
      setPendingProtectedAction('history');
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      return;
    }
    if (tabId === 'promo') {
      setInvestigatingProduct(null);
      setIsDiscountModalOpen(true);
      return;
    }
    setActiveTab(tabId);
  };

  const executeReloadSession = (reloadedItems) => {
    updateCartAndSave(reloadedItems);
    setActiveTab('cart');
  };

  // Reload past session to cart (Task B1 Budget Protection)
  const handleReloadSessionToCart = (session) => {
    if (!session || !session.items) return;
    const reloadedItems = session.items.map((item, idx) => ({
      id: `cart-reloaded-${Date.now()}-${idx}`,
      name: item.name,
      category: item.category || 'pokok',
      unit: item.unit || 'pcs',
      qty: item.qty || 1,
      unitPrice: item.unitPrice || item.finalPrice || 0,
      lastMonthPrice: item.lastMonthPrice || item.unitPrice || null,
      discountString: item.discountString || '',
      store: item.store || session.store || selectedStore,
      date: item.date || selectedDate,
      checked: true
    }));

    const projected = calculateCartTotal(reloadedItems);

    if (budgetCap > 0 && projected > budgetCap && projected > totalCart) {
      setPendingBudgetAction({
        execute: () => executeReloadSession(reloadedItems),
        projectedTotal: projected
      });
      setIsBudgetExceededModalOpen(true);
    } else {
      executeReloadSession(reloadedItems);
    }
  };

  // Reset to default sample
  const handleResetData = () => {
    setCart(getLocalCart());
    setBudgetCap(getLocalBudget());
    setSelectedStore(getLocalStore());
    setSelectedDate(getLocalDate());
    setCatalog(getMasterCatalog());
    setSessions(getPastSessions());
  };

  // Open discount modal from item
  const handleOpenPromoInvestigator = (item) => {
    setInvestigatingProduct(item);
    setIsDiscountModalOpen(true);
  };

  const userDisplayName = currentUser ? (currentUser.displayName || currentUser.email.split('@')[0]) : '';
  const userFirstName = userDisplayName.split(' ')[0];

  return (
    <div className="desktop-viewport-wrapper">
      {/* Ambient background glows for desktop preview */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />

      {/* Smartphone Device Frame */}
      <main className="mobile-device-frame">
        {/* Dynamic Island / Notch */}
        <div className="phone-notch-bar">
          <div className="dynamic-island">
            <div className="camera-lens" />
            <div className="sensor-dot" />
          </div>
        </div>

        {/* Global OAuth Error Toast */}
        {oauthErrorNotice && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.9)',
            color: '#ffffff',
            padding: '10px 14px',
            fontSize: '0.74rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 100
          }}>
            <span>{oauthErrorNotice}</span>
            <button
              onClick={() => setOauthErrorNotice('')}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 800 }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Header */}
        <Header
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenLogin={() => {
            setAuthModalMode('login');
            setIsAuthModalOpen(true);
          }}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          isSupabaseConnected={supabaseStatus}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenDiscountCalc={() => {
            setInvestigatingProduct(null);
            setIsDiscountModalOpen(true);
          }}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />

        {/* Scrollable Screen Content */}
        <div className="app-screen">
          <ToastContainer />
          <div className="app-content-scroll">
            {/* TAB 1: TROLI BELANJA AKTIF */}
            {activeTab === 'cart' && (
              <div>
                {/* F-01: Session Store & Transaction Date Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 14,
                  padding: '8px 12px'
                }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <MapPin size={14} color="var(--primary-light)" style={{ flexShrink: 0 }} />
                    <select
                      value={selectedStore}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '__ADD_NEW_STORE__') {
                          setIsAddStoreModalOpen(true);
                        } else {
                          handleStoreChange(val);
                        }
                      }}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-main)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none',
                        textOverflow: 'ellipsis'
                      }}
                      title="Ubah Toko / Lokasi Belanja Aktif"
                    >
                      {allStores.map((s) => (
                        <option key={s} value={s} style={{ background: 'var(--bg-surface)', color: 'var(--text-main)' }}>
                          {s}
                        </option>
                      ))}
                      <option
                        value="__ADD_NEW_STORE__"
                        style={{ background: 'var(--bg-surface)', color: 'var(--primary-light)', fontWeight: 700 }}
                      >
                        + Tambah Lokasi Baru
                      </option>
                    </select>
                  </div>

                  <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={handleOpenMainDatePicker}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        margin: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--primary-light)',
                        outline: 'none'
                      }}
                      aria-label="Pilih tanggal transaksi"
                      title="Buka pemilih tanggal transaksi"
                    >
                      <Calendar size={13} color="var(--primary-light)" />
                    </button>
                    <input
                      ref={mainDateInputRef}
                      type="date"
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      onClick={handleOpenMainDatePicker}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                      title="Ubah Tanggal Transaksi Belanja"
                    />
                  </div>
                </div>

                {/* F-05: Budget Safety Cap Gauge */}
                <BudgetSafetyGauge
                  totalCart={totalCart}
                  budgetCap={budgetCap}
                  onUpdateBudget={handleUpdateBudget}
                  cartItems={enrichedCart}
                  onRemoveItem={handleDeleteItem}
                />

                {/* Section Header & Fast Actions */}
                <div className="section-title-row">
                  <div className="section-heading">
                    <ShoppingCart size={17} color="var(--primary-light)" style={{ flexShrink: 0 }} />
                    <span className="section-title-text">Daftar Belanjaan di Troli</span>
                    <span className="section-count-badge">{enrichedCart.length} item</span>
                  </div>

                  <div className="section-actions-group">
                    {cart.length > 0 && (
                      <button
                        type="button"
                        className="btn-clear-cart-text"
                        onClick={() => setIsClearCartModalOpen(true)}
                        title="Kosongkan seluruh barang dari troli belanja"
                      >
                        <Trash2 size={13} />
                        <span>Hapus Semua</span>
                      </button>
                    )}
                    <button
                      className="icon-btn"
                      style={{ width: 30, height: 30 }}
                      onClick={() => setIsSettingsModalOpen(true)}
                      title="Atur Budget"
                    >
                      <Filter size={13} />
                    </button>
                  </div>
                </div>

                {/* Empty State */}
                {enrichedCart.length === 0 ? (
                  <div className="empty-state-box">
                    <div className="empty-state-icon">
                      <ShoppingBag size={28} />
                    </div>
                    <div className="empty-state-title">
                      {userFirstName ? `Halo ${userFirstName}, Troli Masih Kosong` : 'Troli Masih Kosong'}
                    </div>
                    <div className="empty-state-desc">
                      Belum ada barang di troli. Tambahkan barang baru atau muat ulang belanjaan bulan lalu.
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => setIsAddModalOpen(true)}
                      style={{ marginTop: 8 }}
                    >
                      <Plus size={16} />
                      <span>Tambah Barang Pertama</span>
                    </button>
                  </div>
                ) : (
                  <div className="grocery-items-container">
                    {enrichedCart.map((item) => (
                      <GroceryItemCard
                        key={item.id}
                        item={item}
                        onUpdateQty={handleUpdateQty}
                        onDeleteItem={handleDeleteItem}
                        onOpenPromoInvestigator={handleOpenPromoInvestigator}
                        onEditItem={(itemToEdit) => {
                          setEditingItem(itemToEdit);
                          setIsAddModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: INVESTIGATOR DISKON & UKURAN KEMASAN (F-03) */}
            {activeTab === 'promo' && (
              <div style={{ textAlign: 'center', padding: '36px 14px' }}>
                <Sparkles size={36} color="var(--primary)" style={{ marginBottom: 12 }} />
                <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
                  Investigator Promo & Diskon Pintar
                </h2>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45, maxWidth: 300, margin: '0 auto 18px' }}>
                  Kalkulator pembongkar promo bertingkat (50% + 20%) & komparasi ukuran kemasan supermarket.
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setIsDiscountModalOpen(true)}
                  style={{ margin: '0 auto', maxWidth: 240 }}
                >
                  <Sparkles size={16} />
                  <span>Buka Modal Kalkulator</span>
                </button>
              </div>
            )}

            {/* TAB 3: RIWAYAT STRUK & DATABASE BULAN LALU (F-06) */}
            {activeTab === 'history' && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Riwayat Belanja & Struk Digital
                  </h2>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Arsip struk tersimpan aman di akun Anda untuk patokan harga bulan berikutnya.
                  </p>
                </div>

                {currentUser ? (
                  <HistoryView
                    sessions={sessions}
                    catalog={catalog}
                    onReloadSessionToCart={handleReloadSessionToCart}
                    onRefreshData={handleResetData}
                  />
                ) : (
                  <div className="empty-state-box" style={{ marginTop: 20 }}>
                    <div className="empty-state-icon">
                      <Lock size={28} />
                    </div>
                    <div className="empty-state-title">
                      Masuk untuk Melihat Riwayat Struk
                    </div>
                    <div className="empty-state-desc">
                      Riwayat struk belanja dan arsip patokan harga disimpan aman di cloud di bawah akun Anda.
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        setAuthModalMode('login');
                        setPendingProtectedAction('history');
                        setIsAuthModalOpen(true);
                      }}
                      style={{ marginTop: 8 }}
                    >
                      <User size={16} />
                      <span>Masuk Sekarang</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: ANALISIS PENGELUARAN & ANGGARAN */}
            {activeTab === 'analytics' && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    Analisis Alokasi Belanja Pribadi
                  </h2>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Pantau pos pengeluaran kebutuhan pokok vs pos lainnya secara transparan.
                  </p>
                </div>

                <BudgetAnalyticsView
                  cartItems={enrichedCart}
                  budgetCap={budgetCap}
                  sessions={sessions}
                />
              </div>
            )}
          </div>

          {/* Floating Primary Action Buttons (Sticky above Bottom Nav on Cart) */}
          {activeTab === 'cart' && (
            <div className="floating-action-container">
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setEditingItem(null);
                  setIsAddModalOpen(true);
                }}
                style={{ minHeight: '46px' }}
              >
                <Plus size={18} strokeWidth={2.6} />
                <span>Barang</span>
              </button>

              <button
                type="button"
                className="btn-checkout"
                onClick={handleAttemptCheckout}
                disabled={enrichedCart.length === 0}
                style={{
                  minHeight: '46px',
                  opacity: enrichedCart.length === 0 ? 0.5 : 1
                }}
              >
                <CheckCircle size={18} />
                <span>Ke Kasir</span>
              </button>
            </div>
          )}

          {/* Floating Native Bottom Navigation Bar */}
          <BottomNav
            activeTab={isDiscountModalOpen ? 'promo' : activeTab}
            onSelectTab={handleSelectTab}
            cartItemCount={enrichedCart.length}
          />
        </div>

        {/* AUTHENTICATION MODAL */}
        {isAuthModalOpen && (
          <div className="modal-backdrop" onClick={() => setIsAuthModalOpen(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 410, margin: 'auto' }}>
              <LoginView
                onLoginSuccess={handleLoginSuccess}
                onClose={() => setIsAuthModalOpen(false)}
                isModal={true}
                initialMode={authModalMode}
              />
            </div>
          </div>
        )}

        {/* USER PROFILE MODAL */}
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onLogout={handleLogout}
          onProfileUpdated={(updatedUser) => setCurrentUser(updatedUser)}
        />

        {/* MODALS */}
        <DiscountCalculatorModal
          isOpen={isDiscountModalOpen}
          onClose={() => {
            setIsDiscountModalOpen(false);
            setInvestigatingProduct(null);
          }}
          initialProduct={investigatingProduct}
          onApplyToCart={(promoProduct) => {
            handleSaveItem({
              id: `cart-${Date.now()}`,
              name: promoProduct.name,
              category: promoProduct.category || 'kebersihan',
              unit: promoProduct.unit || 'botol',
              qty: 1,
              unitPrice: promoProduct.unitPrice,
              lastMonthPrice: null,
              discountString: promoProduct.discountString,
              store: selectedStore,
              date: selectedDate,
              checked: true
            });
            setIsDiscountModalOpen(false);
            setInvestigatingProduct(null);
            setActiveTab('cart');
          }}
        />

        <AddItemModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingItem(null);
          }}
          onSaveItem={handleSaveItem}
          editItem={editingItem}
          catalog={catalog}
          customStores={customStores}
        />

        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          cartItems={enrichedCart}
          budgetCap={budgetCap}
          onFinishShopping={handleFinishShopping}
          currentStore={selectedStore}
          currentDate={selectedDate}
        />

        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          budgetCap={budgetCap}
          onUpdateBudget={handleUpdateBudget}
          onResetData={handleResetData}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        <BudgetExceededModal
          isOpen={isBudgetExceededModalOpen}
          onClose={handleCancelBudgetExceeded}
          onConfirm={handleConfirmBudgetExceeded}
          currentTotal={totalCart}
          budgetCap={budgetCap}
          projectedTotal={pendingBudgetAction?.projectedTotal || 0}
        />

        <ClearCartModal
          isOpen={isClearCartModalOpen}
          onClose={() => setIsClearCartModalOpen(false)}
          onConfirm={handleConfirmClearCart}
          itemCount={cart.length}
          isProcessing={isClearingCart}
        />

        <AddStoreModal
          isOpen={isAddStoreModalOpen}
          onClose={() => setIsAddStoreModalOpen(false)}
          onAddStore={handleAddNewStore}
          existingStores={allStores}
        />
      </main>
    </div>
  );
}

export default App;
