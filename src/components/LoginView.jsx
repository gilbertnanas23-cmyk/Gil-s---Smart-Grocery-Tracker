import React, { useState, useEffect } from 'react';
import { User, UserPlus, Mail, Lock, Check, X, KeyRound, ArrowLeft, AlertCircle } from 'lucide-react';
import {
  loginWithSupabase,
  registerWithSupabase,
  signInWithSupabaseGoogle,
  resetSupabasePassword,
  updateSupabasePassword
} from '../services/supabase';

export function LoginView({
  onLoginSuccess,
  onClose,
  isModal = false,
  initialMode = 'login', // 'login' | 'register' | 'forgot' | 'reset-password'
  resetNoticeMessage = ''
}) {
  const [authMode, setAuthMode] = useState(initialMode); // 'login' | 'register' | 'forgot' | 'reset-password'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successNotice, setSuccessNotice] = useState(resetNoticeMessage);

  useEffect(() => {
    setAuthMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (resetNoticeMessage) {
      setSuccessNotice(resetNoticeMessage);
    }
  }, [resetNoticeMessage]);

  // Handle Login Submit (Supabase Auth)
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (!email.trim()) {
      setErrorMessage('Silakan masukkan Email ID Anda.');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan Password Anda.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithSupabase(email, password, rememberMe);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
        if (onClose) onClose();
      } else {
        setErrorMessage(res.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit (Supabase Auth)
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (!name.trim()) {
      setErrorMessage('Silakan masukkan Nama Lengkap Anda.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Silakan masukkan format Email ID yang valid.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok dengan password yang dimasukkan.');
      return;
    }

    setLoading(true);
    try {
      const res = await registerWithSupabase(email, password, name);
      if (res.success) {
        if (res.requiresEmailConfirmation) {
          setSuccessNotice(res.message || 'Pendaftaran berhasil! Silakan periksa kotak masuk email Anda untuk konfirmasi sebelum masuk.');
          setPassword('');
          setConfirmPassword('');
        } else if (res.user) {
          setSuccessNotice('Registrasi berhasil! Membuka akun Anda...');
          setTimeout(() => {
            onLoginSuccess(res.user);
            if (onClose) onClose();
          }, 800);
        }
      } else {
        setErrorMessage(res.message || 'Gagal mendaftar. Silakan coba lagi.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat registrasi.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth 2.0 via Supabase
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage('');
    setSuccessNotice('');
    try {
      const res = await signInWithSupabaseGoogle();
      if (!res.success) {
        setErrorMessage(res.message || 'Gagal memulai masuk dengan Google.');
        setLoading(false);
      }
      // Browser akan dialihkan ke halaman Google OAuth oleh Supabase
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kendala OAuth Google.');
      setLoading(false);
    }
  };

  // Handle Forgot Password (Send Reset Email via Supabase)
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Masukkan alamat email yang valid untuk menerima instruksi pemulihan.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetSupabasePassword(email);
      if (res.success) {
        setSuccessNotice(res.message || `Tautan reset kata sandi telah dikirim ke ${email}. Periksa kotak masuk atau spam email Anda.`);
      } else {
        setErrorMessage(res.message || 'Gagal mengirim email reset kata sandi.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengirim permintaan.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Set New Password Submit (After Clicking Email Recovery Link)
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessNotice('');

    if (!password || password.length < 6) {
      setErrorMessage('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      const res = await updateSupabasePassword(password);
      if (res.success) {
        setSuccessNotice('Kata sandi berhasil diubah! Membuka aplikasi...');
        setTimeout(() => {
          if (res.user) {
            onLoginSuccess(res.user);
          }
          if (onClose) onClose();
        }, 1200);
      } else {
        setErrorMessage(res.message || 'Gagal memperbarui kata sandi. Tautan mungkin telah kadaluarsa.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-view-wrapper ${isModal ? 'modal-mode' : ''}`}>
      {/* Ambient background glow matching original theme */}
      <div className="login-ambient-glow" />

      {/* Main Glassmorphism Card */}
      <div className="login-glass-card">
        {/* Modal Close Button */}
        {isModal && onClose && (
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              zIndex: 10,
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#94a3b8'
            }}
            title="Tutup dan Lanjut Belanja"
          >
            <X size={18} />
          </button>
        )}

        {/* Top Avatar Circle */}
        <div className="login-avatar-circle">
          {authMode === 'register' && (
            <UserPlus size={34} strokeWidth={1.8} color="var(--primary)" />
          )}
          {authMode === 'login' && (
            <User size={34} strokeWidth={1.8} color="var(--primary)" />
          )}
          {authMode === 'forgot' && (
            <KeyRound size={32} strokeWidth={1.8} color="#f59e0b" />
          )}
          {authMode === 'reset-password' && (
            <Lock size={32} strokeWidth={1.8} color="var(--primary)" />
          )}
        </div>

        {/* Title & Subtitle */}
        <div className="login-title-block">
          <h1 className="login-title">
            {authMode === 'register' && 'DAFTAR AKUN'}
            {authMode === 'login' && 'SMART GROCERY'}
            {authMode === 'forgot' && 'LUPA PASSWORD'}
            {authMode === 'reset-password' && 'RESET PASSWORD'}
          </h1>
          <p className="login-subtitle">
            {authMode === 'register' && 'BUAT AKUN GROCERY BARU'}
            {authMode === 'login' && 'PERSONAL GROCERY TRACKER'}
            {authMode === 'forgot' && 'MASUKKAN EMAIL PEMULIHAN'}
            {authMode === 'reset-password' && 'BUAT KATA SANDI BARU AKUN'}
          </p>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="login-alert error">
            <AlertCircle size={15} style={{ flexShrink: 0, marginRight: 6 }} />
            <span>{errorMessage}</span>
          </div>
        )}
        {successNotice && (
          <div className="login-alert success">
            <Check size={15} style={{ flexShrink: 0, marginRight: 6 }} />
            <span>{successNotice}</span>
          </div>
        )}

        {/* 1. FORM MODE: LOGIN ATAU REGISTER */}
        {(authMode === 'login' || authMode === 'register') && (
          <form onSubmit={authMode === 'register' ? handleRegister : handleLogin} className="login-form">
            {/* Register Mode: Nama Lengkap */}
            {authMode === 'register' && (
              <div className="login-input-pill">
                <span className="login-input-icon">
                  <User size={19} strokeWidth={2} color="#94a3b8" />
                </span>
                <input
                  type="text"
                  className="login-input-field"
                  placeholder="NAMA LENGKAP"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  spellCheck="false"
                  required
                />
              </div>
            )}

            {/* Email Input Pill */}
            <div className="login-input-pill">
              <span className="login-input-icon">
                <Mail size={19} strokeWidth={2} color="#94a3b8" />
              </span>
              <input
                type="email"
                className="login-input-field"
                placeholder="EMAIL ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                required
              />
            </div>

            {/* Password Input Pill */}
            <div className="login-input-pill">
              <span className="login-input-icon">
                <Lock size={19} strokeWidth={2} color="#94a3b8" />
              </span>
              <input
                type="password"
                className="login-input-field"
                placeholder="PASSWORD (MIN 6 KARAKTER)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                required
              />
            </div>

            {/* Register Mode: Konfirmasi Password */}
            {authMode === 'register' && (
              <div className="login-input-pill">
                <span className="login-input-icon">
                  <Lock size={19} strokeWidth={2} color="#94a3b8" />
                </span>
                <input
                  type="password"
                  className="login-input-field"
                  placeholder="KONFIRMASI PASSWORD"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  required
                />
              </div>
            )}

            {/* Login Mode Only: Remember Me & Forget Password Row */}
            {authMode === 'login' && (
              <div className="login-options-row">
                <label
                  className="login-checkbox-label"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  <div className={`login-checkbox ${rememberMe ? 'checked' : ''}`}>
                    {rememberMe && <Check size={12} strokeWidth={3} color="#ffffff" />}
                  </div>
                  <span>REMEMBER ME</span>
                </label>

                <button
                  type="button"
                  className="login-forgot-btn"
                  onClick={() => {
                    setAuthMode('forgot');
                    setErrorMessage('');
                    setSuccessNotice('');
                  }}
                >
                  FORGET PASSWORD?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <div className="login-btn-container" style={{ marginTop: authMode === 'register' ? 8 : 0 }}>
              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading
                  ? (authMode === 'register' ? 'MEMBUAT AKUN...' : 'LOGGING IN...')
                  : (authMode === 'register' ? 'DAFTAR AKUN BARU' : 'LOGIN')
                }
              </button>
            </div>

            {/* Google OAuth (Hadir di mode login & register) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              margin: '14px 0 10px',
              gap: 10,
              width: '100%'
            }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
              <span style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.08em' }}>ATAU</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.1)' }} />
            </div>

            <button
              type="button"
              className="login-google-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{loading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}</span>
            </button>

            {/* Switch Mode Footer */}
            <div className="login-switch-row">
              <span>
                {authMode === 'register' ? 'Sudah memiliki akun?' : 'Belum memiliki akun?'}
              </span>
              <button
                type="button"
                className="login-switch-btn"
                onClick={() => {
                  setAuthMode(authMode === 'register' ? 'login' : 'register');
                  setErrorMessage('');
                  setSuccessNotice('');
                }}
              >
                {authMode === 'register' ? 'Masuk Sekarang' : 'Daftar Akun Baru'}
              </button>
            </div>
          </form>
        )}

        {/* 2. FORM MODE: LUPA PASSWORD */}
        {authMode === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit} className="login-form">
            <p style={{
              fontSize: '0.76rem',
              color: '#94a3b8',
              textAlign: 'center',
              margin: '0 0 16px 0',
              lineHeight: 1.5
            }}>
              Masukkan alamat email terdaftar akun Anda. Kami akan mengirimkan tautan aman untuk mengatur ulang kata sandi Anda.
            </p>

            <div className="login-input-pill">
              <span className="login-input-icon">
                <Mail size={19} strokeWidth={2} color="#94a3b8" />
              </span>
              <input
                type="email"
                className="login-input-field"
                placeholder="EMAIL ID TERDAFTAR"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                spellCheck="false"
                required
              />
            </div>

            <div className="login-btn-container" style={{ marginTop: 8 }}>
              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'MENGIRIM TAUTAN...' : 'KIRIM TAUTAN RESET'}
              </button>
            </div>

            <div className="login-switch-row">
              <button
                type="button"
                className="login-switch-btn"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage('');
                  setSuccessNotice('');
                }}
              >
                <ArrowLeft size={14} />
                <span>Kembali ke Halaman Masuk</span>
              </button>
            </div>
          </form>
        )}

        {/* 3. FORM MODE: ATUR KATA SANDI BARU (SETELAH KLIK LINK RECOVERY) */}
        {authMode === 'reset-password' && (
          <form onSubmit={handleResetPasswordSubmit} className="login-form">
            <p style={{
              fontSize: '0.76rem',
              color: '#94a3b8',
              textAlign: 'center',
              margin: '0 0 16px 0',
              lineHeight: 1.5
            }}>
              Silakan masukkan kata sandi baru untuk akun Anda.
            </p>

            <div className="login-input-pill">
              <span className="login-input-icon">
                <Lock size={19} strokeWidth={2} color="#94a3b8" />
              </span>
              <input
                type="password"
                className="login-input-field"
                placeholder="KATA SANDI BARU (MIN 6 KARAKTER)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                spellCheck="false"
                required
              />
            </div>

            <div className="login-input-pill">
              <span className="login-input-icon">
                <Lock size={19} strokeWidth={2} color="#94a3b8" />
              </span>
              <input
                type="password"
                className="login-input-field"
                placeholder="KONFIRMASI KATA SANDI BARU"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                spellCheck="false"
                required
              />
            </div>

            <div className="login-btn-container" style={{ marginTop: 8 }}>
              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'MENYIMPAN...' : 'SIMPAN KATA SANDI BARU'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginView;
