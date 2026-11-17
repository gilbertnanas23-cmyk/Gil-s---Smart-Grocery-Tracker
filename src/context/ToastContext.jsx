import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toastsRef = useRef(toasts);
  toastsRef.current = toasts;

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    if (!message) return;

    // Prevent immediate duplicate stacking
    const exists = toastsRef.current.some(
      (t) => t.message === message && t.type === type
    );
    if (exists) return;

    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newToast = { id, message, type, duration };

    setToasts((prev) => {
      // Keep maximum 3 visible toasts
      const trimmed = prev.length >= 3 ? prev.slice(prev.length - 2) : prev;
      return [...trimmed, newToast];
    });

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  }, [dismissToast]);

  const value = {
    toasts,
    showToast,
    dismissToast,
    show: showToast,
    success: (msg, dur = 3000) => showToast(msg, 'success', dur),
    error: (msg, dur = 4500) => showToast(msg, 'error', dur),
    warning: (msg, dur = 3500) => showToast(msg, 'warning', dur),
    info: (msg, dur = 3000) => showToast(msg, 'info', dur),
    dismiss: dismissToast
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      show: () => {},
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
      dismiss: () => {}
    };
  }
  return context;
}

export function ToastContainer() {
  const context = useContext(ToastContext);
  if (!context || !context.toasts || context.toasts.length === 0) {
    return null;
  }

  const { toasts, dismissToast } = context;

  return (
    <div
      className="toast-container"
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }) {
  const { type, message } = toast;

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={16} strokeWidth={2.4} />;
      case 'error':
        return <AlertCircle size={16} strokeWidth={2.4} />;
      case 'warning':
        return <AlertTriangle size={16} strokeWidth={2.4} />;
      case 'info':
      default:
        return <Info size={16} strokeWidth={2.4} />;
    }
  };

  return (
    <div className={`toast-notification toast-${type}`}>
      <span className="toast-icon">{renderIcon()}</span>
      <span className="toast-message">{message}</span>
      <button
        type="button"
        className="toast-close-btn"
        onClick={onDismiss}
        aria-label="Tutup notifikasi"
        title="Tutup"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default ToastProvider;
