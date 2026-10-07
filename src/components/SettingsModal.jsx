import React, { useState } from 'react';
import { X, Cloud, Key, Check, RefreshCw, Database, Server, Smartphone, ExternalLink, HelpCircle } from 'lucide-react';
import { getFirebaseConfig, saveCustomFirebaseConfig, testFirebaseConnection } from '../services/firebase';
import { resetToDefaults, triggerCloudSync } from '../services/storage';
import { formatRupiah } from '../utils/formatters';

export function SettingsModal({
  isOpen,
  onClose,
  budgetCap,
  onUpdateBudget,
  onResetData
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

  const handleResetSample = () => {
    if (confirm('Kembalikan semua data ke sampel awal Rian (Beras, Minyak, Telur, Sabun, dll)?')) {
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
            Pengaturan & Integrasi Cloud
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

        {/* 1. Pengaturan Uang Saku Bulanan */}
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

        {/* 2. Integrasi Firebase Firestore */}
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
              <span>Koneksi Firebase Firestore</span>
            </div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Cloud Sync</span>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
            Secara default aplikasi menggunakan <strong>Local Offline Storage</strong> (langsung aktif dan cepat).
            Untuk sinkronisasi realtime lintas perangkat atau cloud database, masukkan kredensial Firebase berikut:
          </div>

          <div className="form-group">
            <label className="form-label">Firebase Project ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: smart-grocery-rian"
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
              placeholder="smart-grocery-rian.firebaseapp.com"
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

        {/* 3. Panduan Deploy Vercel */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '14px',
          marginBottom: '14px'
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Server size={16} />
            <span>Kesiapan Deploy ke Vercel</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
            File <code style={{ color: '#fff' }}>vercel.json</code> sudah terkonfigurasi otomatis dengan routing SPA dan caching PWA.
            Cukup push repository ini ke GitHub lalu import ke Vercel dengan build command <code style={{ color: '#fff' }}>npm run build</code>.
          </div>
        </div>

        {/* 4. Reset Data Awal */}
        <button
          type="button"
          onClick={handleResetSample}
          style={{
            width: '100%',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            borderRadius: '12px',
            padding: '10px',
            fontSize: '0.76rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Reset Seluruh Data ke Sampel Asli Rian
        </button>
      </div>
    </div>
  );
}
