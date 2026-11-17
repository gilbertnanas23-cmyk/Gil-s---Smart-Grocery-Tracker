import React from 'react';
import { Trash2, AlertTriangle, RefreshCw } from 'lucide-react';

export function ClearCartModal({
  isOpen,
  onClose,
  onConfirm,
  itemCount = 0,
  isProcessing = false
}) {
  if (!isOpen) return null;

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
        aria-labelledby="clear-cart-title"
        aria-modal="true"
      >
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid rgba(239, 68, 68, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'var(--danger)'
            }}
          >
            <Trash2 size={26} />
          </div>

          <h3
            id="clear-cart-title"
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginBottom: '6px'
            }}
          >
            Hapus Semua Barang?
          </h3>

          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              lineHeight: 1.45,
              maxWidth: '300px',
              margin: '0 auto'
            }}
          >
            Seluruh barang dalam troli saat ini akan dihapus. Tindakan ini tidak dapat dibatalkan.
          </p>

          {itemCount > 0 && (
            <div
              style={{
                marginTop: '12px',
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
                background: 'var(--bg-input)',
                borderRadius: '8px',
                padding: '6px 12px',
                display: 'inline-block'
              }}
            >
              Menghapus <strong>{itemCount}</strong> barang dari troli aktif
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isProcessing}
            style={{ flex: 1, minHeight: '44px', fontWeight: 600 }}
          >
            Batal
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onConfirm}
            disabled={isProcessing}
            style={{
              flex: 1.2,
              minHeight: '44px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              borderColor: '#dc2626',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
              color: '#ffffff'
            }}
          >
            {isProcessing ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 size={15} />
                <span>Ya, Hapus Semua</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClearCartModal;
