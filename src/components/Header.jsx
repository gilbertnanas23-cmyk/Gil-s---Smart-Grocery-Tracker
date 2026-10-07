import React from 'react';
import { ShoppingCart, Cloud, CloudOff, Smartphone, Monitor, Settings, Sparkles } from 'lucide-react';

export function Header({
  isFirebaseConnected,
  isFullScreen,
  onToggleFullScreen,
  onOpenSettings,
  onOpenDiscountCalc
}) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon-box">
          <ShoppingCart size={22} strokeWidth={2.4} />
        </div>
        <div>
          <h1 className="brand-title">Smart Grocery</h1>
          <div className="brand-subtitle">
            <span style={{ color: '#10b981', display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
            Budget Safety PWA • Kamar 3x3m
          </div>
        </div>
      </div>

      <div className="header-actions">
        {/* Firebase Sync Indicator */}
        <button
          className="icon-btn"
          onClick={onOpenSettings}
          title={isFirebaseConnected ? 'Firebase Cloud: Terhubung & Sinkron' : 'Firebase Cloud: Mode Lokal (Klik untuk Setup)'}
        >
          {isFirebaseConnected ? (
            <Cloud size={18} color="#10b981" />
          ) : (
            <CloudOff size={18} color="#94a3b8" />
          )}
        </button>

        {/* Quick Promo Investigator Shortcut */}
        <button
          className="icon-btn"
          onClick={onOpenDiscountCalc}
          title="Kalkulator Promo & Diskon Bertingkat"
          style={{ color: '#f59e0b' }}
        >
          <Sparkles size={18} />
        </button>

        {/* Desktop Device Frame Toggle */}
        <button
          className="icon-btn"
          onClick={onToggleFullScreen}
          title={isFullScreen ? 'Tampilan Bezel Smartphone' : 'Tampilan Penuh (Fullscreen)'}
        >
          {isFullScreen ? <Smartphone size={18} /> : <Monitor size={18} />}
        </button>

        {/* Settings Dialog */}
        <button
          className="icon-btn"
          onClick={onOpenSettings}
          title="Pengaturan & Firebase"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
