import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Wallet } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { calculateBudgetStatus } from '../utils/calculations';

/**
 * FloatingBudgetMonitor
 * Mini-card mengambang real-time untuk memonitor:
 * 1. Total Belanjaan Keranjang (Total Keranjang)
 * 2. Batas Anggaran Belanja (Batas Uang Saku)
 * 3. Persentase & Status Keamanan Dompet (Budget Usage & Status)
 * 
 * Hanya muncul saat pengguna menggulir (scroll) melewati panel Pengendali Dompet utama
 * dan otomatis menghilang saat panel utama kembali terlihat di layar.
 */
export function FloatingBudgetMonitor({
  isVisible,
  totalCart = 0,
  budgetCap = 0,
  onScrollToBudget
}) {
  if (!isVisible) return null;

  const hasValidBudget = typeof budgetCap === 'number' && !isNaN(budgetCap) && budgetCap > 0;

  let status = 'SAFE';
  let percentage = 0;
  let statusLabel = 'Terkendali';
  let statusClass = 'safe';

  if (hasValidBudget) {
    const budgetInfo = calculateBudgetStatus(totalCart, budgetCap);
    status = budgetInfo.status;
    percentage = budgetInfo.percentage;

    if (status === 'OVERBUDGET') {
      statusLabel = 'Melebihi Anggaran';
      statusClass = 'overbudget';
    } else if (status === 'WARNING') {
      statusLabel = 'Waspada';
      statusClass = 'warning';
    } else {
      statusLabel = 'Terkendali';
      statusClass = 'safe';
    }
  } else {
    statusClass = 'unset';
  }

  return (
    <button
      type="button"
      className={`floating-budget-monitor status-${statusClass}`}
      onClick={onScrollToBudget}
      aria-label="Lihat pengendali dompet"
      title="Klik untuk kembali ke Pengendali Dompet"
    >
      {/* Row 1: Total Keranjang */}
      <div className="floating-budget-row">
        <span className="floating-budget-label">Total Keranjang</span>
        <span className="floating-budget-val primary">{formatRupiah(totalCart)}</span>
      </div>

      {/* Row 2: Batas Uang Saku */}
      <div className="floating-budget-row">
        <span className="floating-budget-label">Batas Uang Saku</span>
        <span className="floating-budget-val muted">
          {hasValidBudget ? formatRupiah(budgetCap) : 'Belum diatur'}
        </span>
      </div>

      {/* Row 3: Status & Persentase Pemakaian */}
      <div className={`floating-budget-status-badge status-${statusClass}`}>
        {hasValidBudget ? (
          <>
            {status === 'SAFE' && <ShieldCheck size={12} strokeWidth={2.4} />}
            {status === 'WARNING' && <AlertTriangle size={12} strokeWidth={2.4} />}
            {status === 'OVERBUDGET' && <AlertOctagon size={12} strokeWidth={2.4} />}
            <span>{statusLabel} ({percentage}%)</span>
          </>
        ) : (
          <>
            <Wallet size={12} strokeWidth={2.4} />
            <span>Tanpa Batas Anggaran</span>
          </>
        )}
      </div>
    </button>
  );
}

export default FloatingBudgetMonitor;
