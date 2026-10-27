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
  Lock,
  Copy
} from 'lucide-react';
import {
  getFirebaseConfig,
  saveCustomFirebaseConfig,
  testFirebaseConnection,
  getAllowedGoogleEmail,
  setAllowedGoogleEmail
} from '../services/firebase';
import {
  getSupabaseConfig,
  saveCustomSupabaseConfig,
  testSupabaseConnection
} from '../services/supabase';
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

  const existingSupabase = getSupabaseConfig() || {
    url: '',
    anonKey: ''
  };

  const [projectId, setProjectId] = useState(existingConfig.projectId || '');
  const [apiKey, setApiKey] = useState(existingConfig.apiKey || '');
  const [authDomain, setAuthDomain] = useState(existingConfig.authDomain || '');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const [supabaseUrl, setSupabaseUrl] = useState(existingSupabase.url || '');
  const [supabaseKey, setSupabaseKey] = useState(existingSupabase.anonKey || '');
  const [supabaseTestResult, setSupabaseTestResult] = useState(null);
  const [supabaseTesting, setSupabaseTesting] = useState(false);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const [customBudget, setCustomBudget] = useState(budgetCap);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveSupabase = () => {
    if (!supabaseUrl && !supabaseKey) {
      saveCustomSupabaseConfig(null);
      setSupabaseTestResult({ success: true, message: 'Supabase dinonaktifkan (mode offline).' });
      return;
    }

    saveCustomSupabaseConfig({
      url: supabaseUrl.trim(),
      anonKey: supabaseKey.trim()
    });
    setSavedSuccess(true);
    triggerCloudSync();
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestSupabase = async () => {
    setSupabaseTesting(true);
    setSupabaseTestResult(null);
    const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setSupabaseTestResult(res);
    setSupabaseTesting(false);
  };

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

  const sqlSchemaText = `-- ==========================================
-- Jalankan di Supabase Dashboard > SQL Editor
-- ==========================================

-- 1. Buat Tabel Profil Pengguna
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- 2. Trigger Otomatis Profil Baru (Email & Google OAuth)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- 3. Tabel Data Troli & Riwayat Belanja
create table if not exists public.grocery_user_data (
  user_id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.grocery_user_data enable row level security;
drop policy if exists "User can access own grocery data" on public.grocery_user_data;
create policy "User can access own grocery data" on public.grocery_user_data for all
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

-- 4. Aktifkan Supabase Realtime untuk Sinkronisasi Multi-Perangkat
alter publication supabase_realtime add table public.grocery_user_data;`;

  const handleCopySql = () => {
    navigator.clipboard?.writeText(sqlSchemaText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
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
            Pengaturan Akun & Database
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

        {/* 1. Status Akun Terautentikasi */}
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
                <span>Akun Supabase Aktif</span>
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

        {/* 3. Integrasi Supabase Cloud (Database & Auth - UTAMA) */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '16px',
          padding: '14px',
          marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Database size={16} />
              <span>Konfigurasi Supabase (Auth & PostgreSQL)</span>
            </div>
            <span style={{
              fontSize: '0.66rem',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              padding: '2px 8px',
              borderRadius: '999px',
              fontWeight: 600
            }}>
              Primary Backend
            </span>
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
            Digunakan untuk Google OAuth, login email, profil pengguna, dan sinkronisasi troli belanja ke database.
          </div>

          <div className="form-group">
            <label className="form-label">Supabase Project URL</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://xyzproject.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Supabase Anon Public API Key</label>
            <input
              type="text"
              className="form-input"
              placeholder="eyJhbGciOiJIUzI1NiIsIn..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
            />
          </div>

          {supabaseTestResult && (
            <div style={{
              background: supabaseTestResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${supabaseTestResult.success ? '#10b981' : '#ef4444'}`,
              color: supabaseTestResult.success ? '#34d399' : '#f87171',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.74rem',
              marginBottom: 10
            }}>
              {supabaseTestResult.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ flex: 1, padding: '10px' }}
              onClick={handleTestSupabase}
              disabled={supabaseTesting || !supabaseUrl}
            >
              <RefreshCw size={14} className={supabaseTesting ? 'animate-spin' : ''} />
              <span>{supabaseTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
            </button>

            <button
              type="button"
              className="btn-primary"
              style={{ flex: 1, padding: '10px' }}
              onClick={handleSaveSupabase}
            >
              <Check size={16} />
              <span>Terapkan Supabase</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontSize: '0.7rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: 0
              }}
            >
              <HelpCircle size={13} />
              <span>{showSqlGuide ? 'Sembunyikan Panduan SQL Supabase' : 'Lihat Skema SQL Database Supabase'}</span>
            </button>

            {showSqlGuide && (
              <button
                type="button"
                onClick={handleCopySql}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.68rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  borderRadius: 6
                }}
              >
                <Copy size={12} />
                <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
              </button>
            )}
          </div>

          {showSqlGuide && (
            <div style={{
              marginTop: 8,
              padding: '10px',
              background: 'rgba(0, 0, 0, 0.45)',
              borderRadius: '8px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.66rem',
              color: '#cbd5e1',
              fontFamily: 'monospace',
              lineHeight: 1.45,
              whiteSpace: 'pre-wrap',
              maxHeight: 220,
              overflowY: 'auto'
            }}>
              {sqlSchemaText}
            </div>
          )}
        </div>

        {/* 4. Reset Data */}
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
