import React, { useState, useEffect } from 'react';
import { Plus, ShoppingCart, CheckCircle, Sparkles, Filter, RefreshCw, ShoppingBag, ShieldCheck } from 'lucide-react';
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
import { BottomNav } from './components/BottomNav';
import {
  INITIAL_CART_ITEMS,
  DEFAULT_MASTER_CATALOG,
  INITIAL_PAST_SESSIONS
} from './data/defaultProducts';
import {
  getLocalCart,
  saveLocalCart,
  getLocalBudget,
  saveLocalBudget,
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
  getFirebaseInstance,
  getStoredAuthUser,
  initAuthListener,
  signOutUser
} from './services/firebase';
import { initSupabaseAuthListener } from './services/supabase';
import { calculateTieredDiscount } from './utils/calculations';
import { formatRupiah } from './utils/formatters';

export function App() {
  // Authentication & Single-User state
  const [currentUser, setCurrentUser] = useState(() => getStoredAuthUser());

  // Main application states
  const [cart, setCart] = useState(() => getLocalCart());
  const [budgetCap, setBudgetCap] = useState(() => getLocalBudget());
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

  // Firebase status
  const [firebaseStatus, setFirebaseStatus] = useState(() => {
    const { isConfigured } = getFirebaseInstance();
    return isConfigured;
  });

  // Listen to Auth State changes on mount (Firebase + Supabase)
  useEffect(() => {
    const handleUserUpdate = (user) => {
      setCurrentUser(user);
      if (user && user.uid) {
        // Coba sinkronisasi data dari cloud (Supabase / Firestore)
        syncUserDataFromCloud(user.uid).then((cloudData) => {
          if (cloudData) {
            setCart(Array.isArray(cloudData.cart) ? cloudData.cart : []);
            setBudgetCap(cloudData.budgetCap || 500000);
            setCatalog(Array.isArray(cloudData.catalog) ? cloudData.catalog : DEFAULT_MASTER_CATALOG);
            setSessions(Array.isArray(cloudData.history) ? cloudData.history : []);
          }
        });
      }
    };

    const unsubFirebase = initAuthListener(handleUserUpdate);
    const unsubSupabase = initSupabaseAuthListener(handleUserUpdate);

    return () => {
      if (typeof unsubFirebase === 'function') unsubFirebase();
      if (typeof unsubSupabase === 'function') unsubSupabase();
    };
  }, []);

  // Update firebase connection status
  useEffect(() => {
    const { isConfigured } = getFirebaseInstance();
    setFirebaseStatus(isConfigured);
  }, [isSettingsModalOpen]);

  // Handle successful login & restore account progress
  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    if (user && user.uid) {
      const cloudData = await syncUserDataFromCloud(user.uid);
      if (cloudData) {
        setCart(Array.isArray(cloudData.cart) ? cloudData.cart : []);
        setBudgetCap(cloudData.budgetCap || 500000);
        setCatalog(Array.isArray(cloudData.catalog) ? cloudData.catalog : DEFAULT_MASTER_CATALOG);
        setSessions(Array.isArray(cloudData.history) ? cloudData.history : []);
      } else {
        // Pengguna baru: inisialisasi data default independen
        setCart(INITIAL_CART_ITEMS);
        setBudgetCap(500000);
        setCatalog(DEFAULT_MASTER_CATALOG);
        setSessions(INITIAL_PAST_SESSIONS);
        saveLocalCart(INITIAL_CART_ITEMS);
        saveLocalBudget(500000);
        saveMasterCatalog(DEFAULT_MASTER_CATALOG);
        savePastSessions(INITIAL_PAST_SESSIONS);
      }
    }
  };

  // Handle user logout & clean account switch
  const handleLogout = async () => {
    triggerCloudSync();
    await signOutUser();
    clearUserDataForAccountSwitch();
    setCart(INITIAL_CART_ITEMS);
    setBudgetCap(500000);
    setCatalog(DEFAULT_MASTER_CATALOG);
    setSessions(INITIAL_PAST_SESSIONS);
    setCurrentUser(null);
  };

  // Calculate cart items with net line totals
  const enrichedCart = cart.map(item => {
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
    const updated = cart.map(item => {
      if (item.id === itemId) {
        return { ...item, qty: Math.max(1, newQty) };
      }
      return item;
    });
    updateCartAndSave(updated);
  };

  // Delete item
  const handleDeleteItem = (itemId) => {
    const updated = cart.filter(item => item.id !== itemId);
    updateCartAndSave(updated);
  };

  // Add / Edit item
  const handleSaveItem = (itemData) => {
    if (editingItem) {
      const updated = cart.map(item => (item.id === itemData.id ? itemData : item));
      updateCartAndSave(updated);
      setEditingItem(null);
    } else {
      const updated = [itemData, ...cart];
      updateCartAndSave(updated);
    }
  };

  // Update budget cap (F-05)
  const handleUpdateBudget = (newCap) => {
    setBudgetCap(newCap);
    saveLocalBudget(newCap);
  };

  // Checkout complete
  const handleFinishShopping = ({ title, budgetCap, totalSpent, totalSaved, cartItems }) => {
    const newSession = checkoutSession({
      title,
      budgetCap,
      totalSpent,
      totalSaved,
      cartItems: enrichedCart
    });
    setCart([]);
    setSessions(getPastSessions());
    setCatalog(getMasterCatalog());
    setActiveTab('history');
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
      checked: true
    }));
    updateCartAndSave(reloadedItems);
    setActiveTab('cart');
  };

  // Reset to default sample
  const handleResetData = () => {
    setCart(getLocalCart());
    setBudgetCap(getLocalBudget());
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

        {/* TAMPILAN JIKA PENGGUNA BELUM LOGIN (Google Login Access Gateway) */}
        {!currentUser ? (
          <div className="app-screen login-screen-active">
            <LoginView
              onLoginSuccess={handleLoginSuccess}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
            />
          </div>
        ) : (
          <>
            {/* Top Header */}
            <Header
              currentUser={currentUser}
              onLogout={handleLogout}
              isFirebaseConnected={firebaseStatus}
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
                        {enrichedCart.map(item => (
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

                    {/* Primary Action Buttons (Thumb-Friendly) */}
                    <div className="floating-action-container">
                      <button
                        className="btn-primary"
                        onClick={() => {
                          setEditingItem(null);
                          setIsAddModalOpen(true);
                        }}
                      >
                        <Plus size={18} strokeWidth={2.6} />
                        <span>+ Barang</span>
                      </button>

                      <button
                        className="btn-checkout"
                        onClick={() => setIsCheckoutModalOpen(true)}
                        disabled={enrichedCart.length === 0}
                        style={{ opacity: enrichedCart.length === 0 ? 0.5 : 1 }}
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

                    <HistoryView
                      sessions={sessions}
                      catalog={catalog}
                      onReloadSessionToCart={handleReloadSessionToCart}
                      onRefreshData={handleResetData}
                    />
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
                onSelectTab={setActiveTab}
                cartItemCount={enrichedCart.length}
              />
            </div>
          </>
        )}
      </main>

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
