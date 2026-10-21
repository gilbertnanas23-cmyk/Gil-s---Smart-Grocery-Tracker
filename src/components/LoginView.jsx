import React, { useState } from 'react';
import { User, Mail, Lock, Check } from 'lucide-react';
import { loginWithEmailAndPassword } from '../services/firebase';

export function LoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resetNotice, setResetNotice] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setResetNotice('');

    if (!email.trim()) {
      setErrorMessage('Silakan masukkan Email ID Anda');
      return;
    }
    if (!password) {
      setErrorMessage('Silakan masukkan Password Anda');
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithEmailAndPassword(email, password, rememberMe);
      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setErrorMessage('Masukkan Email ID terlebih dahulu untuk reset password');
      return;
    }
    setErrorMessage('');
    setResetNotice(`Tautan reset password telah dikirim ke ${email}`);
    setTimeout(() => setResetNotice(''), 4000);
  };

  return (
    <div className="login-view-wrapper">
      {/* Ambient background glow matching original theme */}
      <div className="login-ambient-glow" />

      {/* Main Glassmorphism Card */}
      <div className="login-glass-card">
        {/* Top Avatar Circle */}
        <div className="login-avatar-circle">
          <User size={34} strokeWidth={1.8} color="var(--primary)" />
        </div>

        {/* Title & Subtitle */}
        <div className="login-title-block">
          <h1 className="login-title">SMART GROCERY</h1>
          <p className="login-subtitle">PERSONAL GROCERY TRACKER</p>
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

        {/* Form */}
        <form onSubmit={handleLogin} className="login-form">
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
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {/* Remember Me & Forget Password Row */}
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

          {/* Login Button */}
          <div className="login-btn-container">
            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? 'LOGGING IN...' : 'LOGIN'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default LoginView;
