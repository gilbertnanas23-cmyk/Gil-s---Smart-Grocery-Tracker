import React, { useState, useEffect, useRef } from 'react';
import { X, MapPin, AlertCircle } from 'lucide-react';

export function AddStoreModal({
  isOpen,
  onClose,
  onAddStore,
  existingStores = []
}) {
  const [storeName, setStoreName] = useState('');
  const [validationError, setValidationError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setStoreName('');
      setValidationError('');
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = storeName.trim();

    if (!trimmed) {
      setValidationError('Silakan masukkan nama toko / lokasi belanja.');
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    const isDuplicate = existingStores.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setValidationError(`Lokasi "${trimmed}" sudah ada dalam daftar toko.`);
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    onAddStore(trimmed);
    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      style={{
        justifyContent: 'center',
        padding: '16px',
        zIndex: 220
      }}
    >
      <div
        className="modal-sheet-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          borderRadius: '24px',
          maxWidth: '380px',
          padding: '24px 20px',
          maxHeight: '90vh',
          animation: 'fadeIn 0.2s ease forwards'
        }}
        role="dialog"
        aria-labelledby="add-store-title"
        aria-modal="true"
      >
        <div className="modal-header-row" style={{ marginBottom: 14 }}>
          <h2 id="add-store-title" className="modal-title" style={{ fontSize: '1.05rem' }}>
            <MapPin size={20} color="var(--primary)" />
            <span>Tambah Lokasi Belanja</span>
          </h2>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            title="Tutup"
            aria-label="Tutup modal"
          >
            <X size={18} />
          </button>
        </div>

        {validationError && (
          <div className="login-alert error" style={{ marginBottom: 14 }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label htmlFor="store-name-input" className="form-label">
              Nama Toko / Lokasi
            </label>
            <input
              ref={inputRef}
              id="store-name-input"
              type="text"
              className="form-input"
              placeholder="Contoh: Grand Lucky, Tip Top, Pasar Modern"
              value={storeName}
              onChange={(e) => {
                setStoreName(e.target.value);
                if (validationError) setValidationError('');
              }}
              autoComplete="off"
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ flex: 1, minHeight: '44px' }}
            >
              Batal
            </button>
            <button
              type="submit"
              className="btn-primary"
              style={{ flex: 1.3, minHeight: '44px' }}
            >
              Simpan Lokasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddStoreModal;
