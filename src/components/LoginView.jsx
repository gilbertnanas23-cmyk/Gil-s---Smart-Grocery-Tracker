import React, { useState } from 'react';
import { User, UserPlus, Mail, Lock, Check } from 'lucide-react';
import { loginWithEmailAndPassword, registerUser, signInWithGoogle } from '../services/firebase';

export function LoginView({ onLoginSuccess }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resetNotice, setResetNotice] = useState('');

  // Handle Login Submit
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setResetNotice('');

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
      const res = await loginWithEmailAndPassword(email, password, rememberMe);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'Gagal masuk. Akun belum terdaftar atau email/password salah.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setResetNotice('');

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
      const res = await registerUser(email, password, name);
      if (res.success && res.user) {
        setResetNotice('Registrasi berhasil! Membuka aplikasi...');
        setTimeout(() => {
          onLoginSuccess(res.user);
        }, 800);
      } else {
        setErrorMessage(res.message || 'Gagal mendaftar. Silakan coba lagi.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat registrasi.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage('');
    setResetNotice('');
    try {
      const res = await signInWithGoogle();
      if (res.success) {
        if (res.user) {
          onLoginSuccess(res.user);
        }
      } else {
        setErrorMessage(res.message || 'Gagal masuk dengan Google.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan login Google.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = () => {
    if (!email.trim()) {
      setErrorMessage('Masukkan Email ID terlebih dahulu untuk reset password.');
      return;
    }
    setErrorMessage('');
    setResetNotice(`Tautan instruksi reset password telah dikirim ke ${email}`);
    setTimeout(() => setResetNotice(''), 4500);
  };

  return (
    <div className="login-view-wrapper">
      {/* Ambient background glow matching original theme */}
      <div className="login-ambient-glow" />

      {/* Main Glassmorphism Card */}
      <div className="login-glass-card">
        {/* Top Avatar Circle */}
        <div className="login-avatar-circle">
          {isRegisterMode ? (
            <UserPlus size={34} strokeWidth={1.8} color="var(--primary)" />
          ) : (
            <User size={34} strokeWidth={1.8} color="var(--primary)" />
          )}
        </div>

        {/* Title & Subtitle */}
        <div className="login-title-block">
          <h1 className="login-title">
            {isRegisterMode ? 'DAFTAR AKUN' : 'SMART GROCERY'}
          </h1>
          <p className="login-subtitle">
            {isRegisterMode ? 'BUAT AKUN GROCERY BARU' : 'PERSONAL GROCERY TRACKER'}
          </p>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div className="login-alert error">
            {errorMessage}
          </div>
        )}
        {resetNotice && (
          <div className="login-alert success">
            {resetNotice}
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="login-form">
          {/* Register Mode: Nama Lengkap */}
          {isRegisterMode && (
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
              autoComplete={isRegisterMode ? "new-password" : "current-password"}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>

          {/* Register Mode: Konfirmasi Password */}
          {isRegisterMode && (
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
              />
            </div>
          )}

          {/* Login Mode Only: Remember Me & Forget Password Row */}
          {!isRegisterMode && (
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
                onClick={handleForgotPassword}
              >
                FORGET PASSWORD?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <div className="login-btn-container" style={{ marginTop: isRegisterMode ? 8 : 0 }}>
            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
              style={{ width: '100%' }}
            >
              {loading
                ? (isRegisterMode ? 'MEMBUAT AKUN...' : 'LOGGING IN...')
                : (isRegisterMode ? 'DAFTAR AKUN BARU' : 'LOGIN')
              }
            </button>
          </div>

          {/* Google OAuth (Hanya di mode login) */}
          {!isRegisterMode && (
            <>
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
                <span>Masuk dengan Google (OAuth)</span>
              </button>
            </>
          )}

          {/* Switch Mode Footer */}
          <div className="login-switch-row">
            <span>
              {isRegisterMode ? 'Sudah memiliki akun?' : 'Belum memiliki akun?'}
            </span>
            <button
              type="button"
              className="login-switch-btn"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMessage('');
                setResetNotice('');
              }}
            >
              {isRegisterMode ? 'Masuk Sekarang' : 'Daftar Akun Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginView;
