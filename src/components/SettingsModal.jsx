import React, { useState } from 'react';
import {
  X,
  UserCheck,
  LogOut,
  Sliders
} from 'lucide-react';
import { resetToDefaults } from '../services/storage';

export function SettingsModal({
  isOpen,
  onClose,
  budgetCap,
  onUpdateBudget,
  onResetData,
  currentUser,
  onLogout
}) {
  const [customBudget, setCustomBudget] = useState(budgetCap);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveBudget = () => {
    const b = Number(customBudget);
    if (!isNaN(b) && b > 0) {
      onUpdateBudget(b);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const handleResetSample = () => {
    if (confirm('Kembalikan semua data ke sampel awal kebutuhan pokok (Beras, Minyak, Telur, Sabun, dll)?')) {
      resetToDefaults();
      if (onResetData) onResetData();
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag-handle" />

        <div className="modal-header-row">
          <h2 className="modal-title">
            <Sliders size={20} color="var(--primary)" />
            Pengaturan Akun & Belanja
          </h2>
          <button className="icon-btn" onClick={onClose} title="Tutup">
            <X size={18} />
          </button>
        </div>

        {savedSuccess && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid #10b981',
            color: '#34d399',
            padding: '8px 12px',
            borderRadius: '10px',
            fontSize: '0.78rem',
            marginBottom: 14,
            textAlign: 'center'
          }}>
            Pengaturan berhasil disimpan!
          </div>
        )}

        {/* 1. Status Akun Terautentikasi */}
        {currentUser && (
          <div style={{
            background: 'linear-gradient(135deg, var(--success-bg) 0%, var(--bg-card) 100%)',
            border: '1px solid var(--success-border)',
            borderRadius: '16px',
            padding: '14px',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserCheck size={16} />
                <span>Akun Supabase Aktif</span>
              </div>
              <span style={{
                fontSize: '0.66rem',
                background: 'var(--success-bg)',
                color: 'var(--success)',
                padding: '2px 8px',
                borderRadius: '999px',
                border: '1px solid var(--success-border)',
                fontWeight: 600
              }}>
                Terautentikasi
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName}
                  style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid var(--primary)' }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#fff'
                }}>
                  {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}
                </div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.displayName || 'Pengguna'}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.email}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#60a5fa', marginTop: 2 }}>
                  Metode: {currentUser.provider === 'google' ? 'Google OAuth 2.0' : 'Email & Kata Sandi'}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', padding: '8px 12px', fontSize: '0.78rem', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              onClick={() => {
                onLogout();
                onClose();
              }}
            >
              <LogOut size={14} />
              <span>Keluar (Logout dari Akun Ini)</span>
            </button>
          </div>
        )}

        {/* 2. Pengaturan Uang Saku Bulanan */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '14px',
          marginBottom: '14px'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>
            Uang Saku Belanja Bulanan (Budget Safety Cap)
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              className="form-input"
              value={customBudget}
              onChange={(e) => setCustomBudget(e.target.value)}
              placeholder="Contoh: 500000"
            />
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '0 16px', flexShrink: 0 }}
              onClick={handleSaveBudget}
            >
              Simpan
            </button>
          </div>
        </div>

        {/* 3. Reset Data */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '16px',
          marginTop: '16px'
        }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ width: '100%', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)' }}
            onClick={handleResetSample}
          >
            Reset Seluruh Data Belanja ke Sampel Awal
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
