import React, { useState, useEffect } from 'react';
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
  Calendar
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
  getLocalDate,
  saveLocalDate,
  getMasterCatalog,
  saveMasterCatalog,
  getPastSessions,
  savePastSessions,
  checkoutSession,
  triggerCloudSync,
  syncUserDataFromCloud,
  clearUserDataForAccountSwitch
} from './services/storage';
import {
  getSupabaseInstance,
  getStoredAuthUser,
  initSupabaseAuthListener,
  signOutFromSupabase,
  subscribeToUserGroceryRealtime
} from './services/supabase';
import { calculateTieredDiscount } from './utils/calculations';
import { formatRupiah } from './utils/formatters';

export function App() {
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
  const [selectedDate, setSelectedDate] = useState(() => getLocalDate());
  const [catalog, setCatalog] = useState(() => getMasterCatalog());
  const [sessions, setSessions] = useState(() => getPastSessions());
  const [activeTab, setActiveTab] = useState('cart'); // 'cart' | 'promo' | 'history' | 'analytics'
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [investigatingProduct, setInvestigatingProduct] = useState(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

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
            if (Array.isArray(cloudData.cart)) setCart(cloudData.cart);
            if (cloudData.budgetCap) setBudgetCap(Number(cloudData.budgetCap));
            if (cloudData.store) setSelectedStore(cloudData.store);
            if (cloudData.date) setSelectedDate(cloudData.date);
            if (Array.isArray(cloudData.catalog)) setCatalog(cloudData.catalog);
            if (Array.isArray(cloudData.history)) setSessions(cloudData.history);
          }
        });
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
    triggerCloudSync();
    await signOutFromSupabase();
    clearUserDataForAccountSwitch();
    setCart(INITIAL_CART_ITEMS);
    setBudgetCap(500000);
    setSelectedStore(DEFAULT_STORES[0]);
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

  // Sync cart changes to storage
  const updateCartAndSave = (newCart) => {
    setCart(newCart);
    saveLocalCart(newCart);
  };

  // Quantity Stepper (F-02)
  const handleUpdateQty = (itemId, newQty) => {
    const updated = cart.map((item) => {
      if (item.id === itemId) {
        return { ...item, qty: Math.max(1, newQty) };
      }
      return item;
    });
    updateCartAndSave(updated);
  };

  // Delete item
  const handleDeleteItem = (itemId) => {
    const updated = cart.filter((item) => item.id !== itemId);
    updateCartAndSave(updated);
  };

  // Add / Edit item
  const handleSaveItem = (itemData) => {
    const dataWithStoreAndDate = {
      ...itemData,
      store: itemData.store || selectedStore,
      date: itemData.date || selectedDate
    };

    if (editingItem) {
      const updated = cart.map((item) => (item.id === dataWithStoreAndDate.id ? dataWithStoreAndDate : item));
      updateCartAndSave(updated);
      setEditingItem(null);
    } else {
      const updated = [dataWithStoreAndDate, ...cart];
      updateCartAndSave(updated);
    }
  };

  // Update budget cap (F-05)
  const handleUpdateBudget = (newCap) => {
    setBudgetCap(newCap);
    saveLocalBudget(newCap);
  };

  // Update active store
  const handleStoreChange = (newStore) => {
    setSelectedStore(newStore);
    saveLocalStore(newStore);
  };

  // Update active date
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    saveLocalDate(newDate);
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
    setActiveTab(tabId);
  };

  // Reload past session to cart
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
    updateCartAndSave(reloadedItems);
    setActiveTab('cart');
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
      <main className={`mobile-device-frame ${isFullScreen ? 'full-screen-mode' : ''}`}>
        {/* Dynamic Island / Notch */}
        {!isFullScreen && (
          <div className="phone-notch-bar">
            <div className="dynamic-island">
              <div className="camera-lens" />
              <div className="sensor-dot" />
            </div>
          </div>
        )}

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
          isFullScreen={isFullScreen}
          onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenDiscountCalc={() => {
            setInvestigatingProduct(null);
            setIsDiscountModalOpen(true);
          }}
        />

        {/* Scrollable Screen Content */}
        <div className="app-screen">
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
                  background: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 14,
                  padding: '8px 12px'
                }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <MapPin size={14} color="var(--primary-light)" style={{ flexShrink: 0 }} />
                    <select
                      value={selectedStore}
                      onChange={(e) => handleStoreChange(e.target.value)}
                      style={{
                        width: '100%',
                        background: 'none',
                        border: 'none',
                        color: '#f8fafc',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        outline: 'none',
                        textOverflow: 'ellipsis'
                      }}
                      title="Ubah Toko / Lokasi Belanja Aktif"
                    >
                      {DEFAULT_STORES.map((s) => (
                        <option key={s} value={s} style={{ background: '#0f172a', color: '#fff' }}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ width: 1, height: 16, background: 'rgba(255, 255, 255, 0.15)' }} />

                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    <Calendar size={13} color="var(--primary-light)" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
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
                    <ShoppingCart size={17} color="var(--primary-light)" />
                    <span>Daftar Belanjaan di Troli</span>
                    <span className="section-count-badge">{enrichedCart.length} item</span>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
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
                      Kamu belum memasukkan belanjaan ke troli. Tekan tombol di bawah untuk menambah barang atau muat ulang daftar belanjaan bulan lalu!
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

                {/* Primary Action Buttons (Thumb-Friendly, Min Target 44px) */}
                <div className="floating-action-container">
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setEditingItem(null);
                      setIsAddModalOpen(true);
                    }}
                    style={{ minHeight: '44px' }}
                  >
                    <Plus size={18} strokeWidth={2.6} />
                    <span>+ Barang</span>
                  </button>

                  <button
                    className="btn-checkout"
                    onClick={handleAttemptCheckout}
                    disabled={enrichedCart.length === 0}
                    style={{
                      minHeight: '44px',
                      opacity: enrichedCart.length === 0 ? 0.5 : 1
                    }}
                  >
                    <CheckCircle size={18} />
                    <span>Ke Kasir</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: INVESTIGATOR DISKON & UKURAN KEMASAN (F-03) */}
            {activeTab === 'promo' && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sparkles size={18} color="#f59e0b" />
                    <span>Investigator Promo Supermarket</span>
                  </h2>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Kalkulator pembongkar promo cuci gudang bertingkat (50% + 20%) & perbandingan kemasan (1L vs 5L).
                  </p>
                </div>

                <DiscountCalculatorModal
                  isOpen={true}
                  onClose={() => setActiveTab('cart')}
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
                    setActiveTab('cart');
                  }}
                />
              </div>
            )}

            {/* TAB 3: RIWAYAT STRUK & DATABASE BULAN LALU (F-06) */}
            {activeTab === 'history' && (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
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
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
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

          {/* Floating Native Bottom Navigation Bar */}
          <BottomNav
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            cartItemCount={enrichedCart.length}
          />
        </div>
      </main>

      {/* AUTHENTICATION MODAL */}
      {isAuthModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAuthModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 410 }}>
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
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        onSaveItem={handleSaveItem}
        editItem={editingItem}
        catalog={catalog}
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
    </div>
  );
}

export default App;
