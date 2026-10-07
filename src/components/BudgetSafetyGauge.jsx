import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Wallet, Edit3, Check, Sparkles } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { calculateBudgetStatus } from '../utils/calculations';

export function BudgetSafetyGauge({
  totalCart,
  budgetCap,
  onUpdateBudget,
  cartItems = [],
  onRemoveItem
}) {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budgetCap);
  const [showReliefSuggestions, setShowReliefSuggestions] = useState(false);

  const budgetInfo = calculateBudgetStatus(totalCart, budgetCap);
  const fillWidth = Math.min(100, budgetInfo.percentage);

  const handleSaveBudget = () => {
    const val = Number(tempBudget);
    if (!isNaN(val) && val > 0) {
      onUpdateBudget(val);
    }
    setIsEditingBudget(false);
  };

  // Penyelamat Kasir: Cari kombinasi item yang bisa dibatalkan jika overbudget
  const overAmount = Math.max(0, totalCart - budgetCap);
  const reliefCandidates = cartItems
    .filter(item => item.checked !== false)
    .sort((a, b) => (b.lineTotal || 0) - (a.lineTotal || 0));

  return (
    <div className={`budget-gauge-card status-${budgetInfo.status.toLowerCase()}`}>
      {/* Header Row */}
      <div className="gauge-header-row">
        <div className="gauge-title-box">
          <Wallet size={16} color="var(--primary-light)" />
          <span>Pengendali Dompet (Safety Cap)</span>
        </div>

        <div className={`gauge-status-badge ${budgetInfo.status.toLowerCase()}`}>
          {budgetInfo.status === 'SAFE' && <ShieldCheck size={14} />}
          {budgetInfo.status === 'WARNING' && <AlertTriangle size={14} />}
          {(budgetInfo.status === 'CRITICAL' || budgetInfo.status === 'OVERBUDGET') && (
            <AlertOctagon size={14} />
          )}
          <span>{budgetInfo.badgeText} ({budgetInfo.percentage}%)</span>
        </div>
      </div>

      {/* Amounts Row */}
      <div className="gauge-amounts-row">
        <div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>
            Total Keranjang Saat Ini:
          </div>
          <div className="gauge-total-cart">
            {formatRupiah(totalCart)}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
            <span>Batas Uang Saku:</span>
            {!isEditingBudget && (
              <button
                onClick={() => {
                  setTempBudget(budgetCap);
                  setIsEditingBudget(true);
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Ubah Batas Anggaran"
              >
                <Edit3 size={12} />
              </button>
            )}
          </div>

          {isEditingBudget ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <input
                type="number"
                value={tempBudget}
                onChange={(e) => setTempBudget(e.target.value)}
                autoFocus
                style={{
                  width: '100px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--primary)',
                  color: '#fff',
                  borderRadius: '6px',
                  padding: '3px 6px',
                  fontSize: '0.85rem'
                }}
              />
              <button
                onClick={handleSaveBudget}
                style={{
                  background: 'var(--primary)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  padding: '4px',
                  cursor: 'pointer'
                }}
              >
                <Check size={14} />
              </button>
            </div>
          ) : (
            <div className="gauge-budget-limit">
              {formatRupiah(budgetCap)}
            </div>
          )}
        </div>
      </div>

      {/* Progress Track */}
      <div className="gauge-progress-track">
        <div
          className="gauge-progress-fill"
          style={{
            width: `${fillWidth}%`,
            backgroundColor: budgetInfo.colorTheme
          }}
        />
      </div>

      {/* Footer Info Row */}
      <div className="gauge-footer-row">
        <span>Sisa Uang Saku:</span>
        <span className={`gauge-remaining-val ${budgetInfo.remaining >= 0 ? 'positive' : 'negative'}`}>
          {budgetInfo.remaining >= 0
            ? `${formatRupiah(budgetInfo.remaining)} aman`
            : `Minus ${formatRupiah(Math.abs(budgetInfo.remaining))}!`}
        </span>
      </div>

      {/* Status Alert Banner */}
      {budgetInfo.status !== 'SAFE' && (
        <div className={`safety-alert-banner ${budgetInfo.status.toLowerCase()}`}>
          {budgetInfo.status === 'OVERBUDGET' ? (
            <AlertOctagon size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          ) : (
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
          )}
          <div style={{ flex: 1 }}>
            <div>{budgetInfo.alertMessage}</div>

            {/* Quick Action Penyelamat Kasir saat Overbudget */}
            {budgetInfo.status === 'OVERBUDGET' && (
              <div style={{ marginTop: 6 }}>
                <button
                  onClick={() => setShowReliefSuggestions(!showReliefSuggestions)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.25)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
                  }}
                >
                  <Sparkles size={13} />
                  {showReliefSuggestions ? 'Sembunyikan Solusi' : 'Penyelamat Kasir: Saran Item Dibatalkan'}
                </button>

                {showReliefSuggestions && reliefCandidates.length > 0 && (
                  <div style={{ marginTop: 8, background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', padding: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#fca5a5', marginBottom: 6 }}>
                      Pilih barang berikut untuk dibatalkan agar total pas di dompet (kurang Rp {overAmount.toLocaleString('id-ID')}):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {reliefCandidates.slice(0, 3).map(candidate => (
                        <div
                          key={candidate.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem'
                          }}
                        >
                          <span style={{ color: '#fff' }}>{candidate.name} ({candidate.qty}x)</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ color: '#f87171', fontWeight: 600 }}>
                              -{formatRupiah(candidate.lineTotal)}
                            </span>
                            <button
                              onClick={() => onRemoveItem && onRemoveItem(candidate.id)}
                              style={{
                                background: '#ef4444',
                                border: 'none',
                                color: '#fff',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.65rem',
                                cursor: 'pointer',
                                fontWeight: 700
                              }}
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
