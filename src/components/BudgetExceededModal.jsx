import React from 'react';
import { AlertOctagon, X, ArrowRight, ShieldAlert } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

export function BudgetExceededModal({
  isOpen,
  onClose,
  onConfirm,
  currentTotal = 0,
  budgetCap = 0,
  projectedTotal = 0,
  actionType = 'tambah'
}) {
  if (!isOpen) return null;

  const excessAmount = Math.max(0, projectedTotal - budgetCap);
  const excessPercent = budgetCap > 0 ? Math.round(((projectedTotal - budgetCap) / budgetCap) * 100) : 0;

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
          maxWidth: '400px',
          padding: '24px 20px',
          maxHeight: '90vh',
          animation: 'fadeIn 0.2s ease forwards'
        }}
        role="dialog"
        aria-labelledby="budget-exceeded-title"
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
            <AlertOctagon size={28} />
          </div>

          <h3
            id="budget-exceeded-title"
            style={{
              fontSize: '1.15rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginBottom: '6px'
            }}
          >
            Belanja Melebihi Anggaran!
          </h3>

          <p
            style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              lineHeight: 1.45,
              maxWidth: '320px',
              margin: '0 auto'
            }}
          >
            Tindakan ini akan membuat total belanjaan Anda melampaui batas uang saku yang telah ditentukan.
          </p>
        </div>

        {/* Comparison Metrics Card */}
        <div
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '16px',
            padding: '14px',
            marginBottom: '18px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total Belanja Saat Ini:</span>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{formatRupiah(currentTotal)}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Batas Anggaran (Budget):</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{formatRupiah(budgetCap)}</span>
          </div>

          <div
            style={{
              height: '1px',
              background: 'var(--border-subtle)',
              margin: '8px 0'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '0.8rem', marginBottom: '6px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Estimasi Total Baru:</span>
            <span style={{ fontWeight: 800, color: 'var(--danger)', fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>
              {formatRupiah(projectedTotal)}
            </span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              color: 'var(--danger)',
              padding: '3px 8px',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: 700,
              width: '100%',
              justifyContent: 'center',
              marginTop: '4px'
            }}
          >
            <ShieldAlert size={13} />
            <span>Kelebihan Anggaran: +{formatRupiah(excessAmount)} ({excessPercent}%)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{ flex: 1, minHeight: '44px', fontWeight: 600 }}
          >
            Batal
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onConfirm}
            style={{
              flex: 1.3,
              minHeight: '44px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              borderColor: '#dc2626',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)'
            }}
          >
            <span>Tetap Lanjutkan</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default BudgetExceededModal;
