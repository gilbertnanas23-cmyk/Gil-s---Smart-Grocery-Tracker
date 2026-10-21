import React, { useState } from 'react';
import {
  X,
  Cloud,
  Key,
  Check,
  RefreshCw,
  Database,
  Server,
  Smartphone,
  ExternalLink,
  HelpCircle,
  UserCheck,
  ShieldCheck,
  LogOut,
  Mail,
  Lock
} from 'lucide-react';
import {
  getFirebaseConfig,
  saveCustomFirebaseConfig,
  testFirebaseConnection,
  getAllowedGoogleEmail,
  setAllowedGoogleEmail
} from '../services/firebase';
import { resetToDefaults, triggerCloudSync } from '../services/storage';
import { formatRupiah } from '../utils/formatters';

export function SettingsModal({
  isOpen,
  onClose,
  budgetCap,
  onUpdateBudget,
  onResetData,
  currentUser,
  onLogout
}) {
  const existingConfig = getFirebaseConfig() || {
    projectId: '',
    apiKey: '',
    authDomain: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  };

  const [projectId, setProjectId] = useState(existingConfig.projectId || '');
  const [apiKey, setApiKey] = useState(existingConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(existingConfig.authDomain || '');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);
  const [customBudget, setCustomBudget] = useState(budgetCap);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [allowedEmail, setAllowedEmailInput] = useState(() => getAllowedGoogleEmail());

  if (!isOpen) return null;

  const handleSaveFirebase = async () => {
    if (!projectId && !apiKey) {
      saveCustomFirebaseConfig(null);
      setTestResult({ success: true, message: 'Kembali ke mode penyimpanan lokal (Offline Storage).' });
      return;
    }

    const config = {
      projectId: projectId.trim(),
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`
    };

    saveCustomFirebaseConfig(config);
    setSavedSuccess(true);
    triggerCloudSync();
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    const config = {
      projectId: projectId.trim(),
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`
    };

    const res = await testFirebaseConnection(config);
    setTestResult(res);
    setTesting(false);
  };

  const handleSaveBudget = () => {
    const b = Number(customBudget);
    if (!isNaN(b) && b > 0) {
      onUpdateBudget(b);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const handleSaveAllowedEmail = () => {
    setAllowedGoogleEmail(allowedEmail);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
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
            <Server size={20} color="var(--primary)" />
            Pengaturan Akun & Cloud
          </h2>
          <button className="icon-btn" onClick={onClose}>
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

        {/* 1. Status Akun Google */}
        {currentUser && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(15, 23, 42, 0.7) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px',
            padding: '14px',
            marginBottom: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserCheck size={16} />
                <span>Akun Google Terhubung</span>
              </div>
              <span style={{
                fontSize: '0.66rem',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                padding: '2px 8px',
                borderRadius: '999px',
                border: '1px solid rgba(16, 185, 129, 0.4)',
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
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.displayName || 'Pengguna'}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.email}
                </div>
                {currentUser.isDemo && (
                  <div style={{ fontSize: '0.68rem', color: '#f59e0b', marginTop: 2 }}>
                    (Mode Uji Coba / Demo Google)
                  </div>
                )}
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

        {/* 2. Pembatasan Email Single User (Whitelist) */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '14px',
          marginBottom: '14px'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Lock size={15} color="#38bdf8" />
            <span>Batasi Akses Akun (Whitelist Email)</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.4 }}>
            Opsional: Masukkan email Google spesifik Anda. Jika diisi, hanya email ini yang dapat masuk ke aplikasi ini. Kosongkan untuk mengizinkan akun Google pribadi mana pun.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              className="form-input"
              value={allowedEmail}
              onChange={(e) => setAllowedEmailInput(e.target.value)}
              placeholder="Contoh: gilbert.nanas23@gmail.com"
            />
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '0 14px', flexShrink: 0 }}
              onClick={handleSaveAllowedEmail}
            >
              Terapkan
            </button>
          </div>
        </div>

        {/* 3. Pengaturan Uang Saku Bulanan */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '14px',
          marginBottom: '14px'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
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

        {/* 4. Integrasi Firebase Firestore & Auth */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cloud size={16} />
              <span>Koneksi Firebase Cloud (Firestore & Auth)</span>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Cloud Sync</span>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
            Digunakan untuk autentikasi Google resmi dan sinkronisasi data antar perangkat.
            Kredensial dapat dimasukkan di sini atau melalui file <code style={{ color: '#fff' }}>.env</code>:
          </div>

          <div className="form-group">
            <label className="form-label">Firebase Project ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: smart-grocery-tracker"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Firebase API Key</label>
            <input
              type="text"
              className="form-input"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Firebase Auth Domain (Opsional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="smart-grocery-tracker.firebaseapp.com"
              value={authDomain}
              onChange={(e) => setAuthDomain(e.target.value)}
            />
          </div>

          {testResult && (
            <div style={{
              background: testResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${testResult.success ? '#10b981' : '#ef4444'}`,
              color: testResult.success ? '#34d399' : '#f87171',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              marginBottom: 10
            }}>
              {testResult.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1, padding: '10px' }}
              onClick={handleTestConnection}
              disabled={testing || !projectId}
            >
              <RefreshCw size={14} className={testing ? 'animate-spin' : ''} />
              <span>{testing ? 'Menguji...' : 'Uji Koneksi'}</span>
            </button>

            <button
              type="button"
              className="btn-primary"
              style={{ flex: 1, padding: '10px' }}
              onClick={handleSaveFirebase}
            >
              <Check size={16} />
              <span>Terapkan</span>
            </button>
          </div>
        </div>

        {/* 5. Reset Data */}
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
