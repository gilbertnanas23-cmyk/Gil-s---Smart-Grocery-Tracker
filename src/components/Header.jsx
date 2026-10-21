import React, { useState } from 'react';
import {
  ShoppingCart,
  Cloud,
  CloudOff,
  Smartphone,
  Monitor,
  Settings,
  Sparkles,
  LogOut,
  UserCheck,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

export function Header({
  currentUser,
  onLogout,
  isFirebaseConnected,
  isFullScreen,
  onToggleFullScreen,
  onOpenSettings,
  onOpenDiscountCalc
}) {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Initial letter for fallback avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = currentUser ? (currentUser.displayName || currentUser.email.split('@')[0]) : 'Pribadi';
  const firstName = displayName.split(' ')[0];

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
            <span>Budget Guard • {firstName}</span>
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
          title="Pengaturan Akun & Cloud"
        >
          <Settings size={18} />
        </button>

        {/* User Profile Avatar / Logout Trigger */}
        {currentUser && (
          <div className="header-user-wrapper">
            <button
              className="user-avatar-btn"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              title={`Akun: ${currentUser.email} (Klik untuk opsi)`}
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={displayName}
                  className="user-avatar-img"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="user-avatar-fallback">
                  {getInitials(displayName)}
                </div>
              )}
              <span className="user-status-dot" />
            </button>

            {/* Quick Profile Popover */}
            {showUserDropdown && (
              <>
                <div
                  className="popover-backdrop"
                  onClick={() => setShowUserDropdown(false)}
                />
                <div className="user-dropdown-popover">
                  <div className="dropdown-user-info">
                    <div className="dropdown-user-name">{displayName}</div>
                    <div className="dropdown-user-email">{currentUser.email}</div>
                    <div className="dropdown-badge">
                      <ShieldCheck size={12} color="#10b981" />
                      <span>Akun Google Terverifikasi</span>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <button
                    className="dropdown-menu-item"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onOpenSettings();
                    }}
                  >
                    <Settings size={14} />
                    <span>Pengaturan Aplikasi</span>
                  </button>

                  <button
                    className="dropdown-menu-item danger"
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                    }}
                  >
                    <LogOut size={14} />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
