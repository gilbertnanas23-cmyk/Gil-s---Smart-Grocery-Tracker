import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  ShieldCheck,
  Calendar,
  LogOut,
  Save,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Sparkles
} from 'lucide-react';
import { updateUserProfile } from '../services/supabase';

export function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  onLogout,
  onProfileUpdated
}) {
  const [fullName, setFullName] = useState(currentUser?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.photoURL || '');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.displayName || '');
      setAvatarUrl(currentUser.photoURL || '');
    }
  }, [currentUser]);

  if (!isOpen || !currentUser) return null;

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const isGoogleUser = currentUser.provider === 'google' || !!currentUser.photoURL;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setNotice({ type: 'error', message: 'Nama lengkap tidak boleh kosong.' });
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const res = await updateUserProfile(currentUser.uid, {
        fullName: fullName.trim(),
        avatarUrl: avatarUrl.trim()
      });

      if (res.success) {
        setNotice({ type: 'success', message: 'Profil Anda berhasil diperbarui!' });
        if (onProfileUpdated && res.user) {
          onProfileUpdated(res.user);
        }
        setTimeout(() => setNotice(null), 3000);
      } else {
        setNotice({ type: 'error', message: res.message || 'Gagal memperbarui profil.' });
      }
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Terjadi kesalahan sistem.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag-handle" />

        {/* Header */}
        <div className="modal-header-row">
          <h2 className="modal-title">
            <User size={20} color="var(--primary)" />
            Profil & Akun Belanja
          </h2>
          <button className="icon-btn" onClick={onClose} title="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* User Badge Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: 16,
          background: 'rgba(30, 41, 59, 0.6)',
          borderRadius: 16,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: 16
        }}>
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName}
              referrerPolicy="no-referrer"
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--primary)',
                boxShadow: '0 0 12px var(--primary-glow)'
              }}
            />
          ) : (
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 800,
              boxShadow: '0 0 12px var(--primary-glow)'
            }}>
              {getInitials(currentUser.displayName || currentUser.email)}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '1.02rem',
              fontWeight: 800,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {currentUser.displayName || 'Pengguna'}
            </div>
            <div style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              marginTop: 2
            }}>
              <Mail size={12} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.email}</span>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 6,
              padding: '2px 8px',
              borderRadius: 9999,
              background: isGoogleUser ? 'rgba(66, 133, 244, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${isGoogleUser ? 'rgba(66, 133, 244, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              fontSize: '0.66rem',
              fontWeight: 700,
              color: isGoogleUser ? '#60a5fa' : '#34d399'
            }}>
              <ShieldCheck size={11} />
              <span>{isGoogleUser ? 'Akun Google OAuth Terhubung' : 'Akun Email Terverifikasi'}</span>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {notice && (
          <div className={`login-alert ${notice.type}`} style={{ marginBottom: 14 }}>
            {notice.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            <span>{notice.message}</span>
          </div>
        )}

        {/* Profile Edit Form */}
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: 12 }}>
            <label style={{
              display: 'block',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              marginBottom: 6,
              letterSpacing: '0.05em'
            }}>
              NAMA LENGKAP
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="login-input-field"
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: '0.84rem'
              }}
              placeholder="Nama lengkap Anda"
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'block',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: 'var(--text-muted)',
              marginBottom: 6,
              letterSpacing: '0.05em'
            }}>
              EMAIL AKUN (TERDAFTAR DI SUPABASE)
            </label>
            <input
              type="email"
              value={currentUser.email}
              disabled
              className="login-input-field"
              style={{
                width: '100%',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: '0.84rem',
                color: '#64748b',
                cursor: 'not-allowed'
              }}
            />
          </div>

          {/* User ID Supabase (read only reference) */}
          <div style={{
            fontSize: '0.68rem',
            color: '#64748b',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '8px 12px',
            borderRadius: 8,
            marginBottom: 16,
            wordBreak: 'break-all'
          }}>
            <span style={{ fontWeight: 700 }}>UID Supabase:</span> {currentUser.uid}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ flex: 1, height: 42, justifyContent: 'center' }}
            >
              <Save size={16} />
              <span>{saving ? 'Menyimpan...' : 'Simpan Profil'}</span>
            </button>

            <button
              type="button"
              className="icon-btn"
              onClick={() => {
                onClose();
                onLogout();
              }}
              title="Keluar dari Akun"
              style={{
                height: 42,
                padding: '0 16px',
                borderRadius: 9999,
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontWeight: 700,
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <LogOut size={16} />
              <span>Keluar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProfileModal;

