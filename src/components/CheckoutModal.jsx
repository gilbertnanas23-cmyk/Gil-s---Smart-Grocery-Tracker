import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, AlertOctagon, Printer, Share2, Sparkles, ShoppingBag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatRupiah, formatDateTime } from '../utils/formatters';
import { calculateBudgetStatus } from '../utils/calculations';

export function CheckoutModal({
  isOpen,
  onClose,
  cartItems = [],
  budgetCap,
  onFinishShopping
}) {
  const [sessionTitle, setSessionTitle] = useState(
    `Belanja Bulanan Kos - ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
  );
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Total cart calculation
  const totalCart = cartItems.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
  const totalOriginal = cartItems.reduce((acc, item) => acc + ((item.unitPrice || 0) * (item.qty || 1)), 0);
  const totalSavings = Math.max(0, totalOriginal - totalCart);
  const budgetInfo = calculateBudgetStatus(totalCart, budgetCap);

  const handleComplete = () => {
    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.log('Confetti effect:', e);
    }

    onFinishShopping({
      title: sessionTitle,
      budgetCap,
      totalSpent: totalCart,
      totalSaved: totalSavings,
      cartItems
    });
    onClose();
  };

  const handleCopyReceipt = () => {
    const lines = [
      `🛒 STRUK BELANJA BULANAN PRIBADI`,
      `Tanggal: ${new Date().toLocaleDateString('id-ID')}`,
      `---------------------------------`,
      ...cartItems.map(item => `- ${item.name} (${item.qty}x @ ${formatRupiah(item.unitPrice)}) = ${formatRupiah(item.lineTotal)}`),
      `---------------------------------`,
      `TOTAL AKHIR: ${formatRupiah(totalCart)}`,
      `HEMAT PROMO: ${formatRupiah(totalSavings)}`,
      `SISA DOMPET: ${formatRupiah(budgetInfo.remaining)}`,
      `Status Kasir: AMAN TANPA MALU! 👍`
    ];
    navigator.clipboard?.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag-handle" />

        <div className="modal-header-row">
          <h2 className="modal-title">
            <CheckCircle size={20} color="var(--primary)" />
            Pemeriksaan Kasir & Selesai Belanja
          </h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Status Verifikasi Dompet */}
        <div style={{
          background: budgetInfo.status === 'OVERBUDGET' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${budgetInfo.status === 'OVERBUDGET' ? '#ef4444' : '#10b981'}`,
          borderRadius: '16px',
          padding: '14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {budgetInfo.status === 'OVERBUDGET' ? (
            <AlertOctagon size={32} color="#ef4444" style={{ flexShrink: 0 }} />
          ) : (
            <ShieldCheck size={32} color="#10b981" style={{ flexShrink: 0 }} />
          )}

          <div>
            <div style={{
              fontWeight: 800,
              fontSize: '0.92rem',
              color: budgetInfo.status === 'OVERBUDGET' ? '#f87171' : '#34d399'
            }}>
              {budgetInfo.status === 'OVERBUDGET'
                ? 'JANGAN KE KASIR DULU!'
                : 'SIAP MELANGKAH KE KASIR!'}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {budgetInfo.status === 'OVERBUDGET'
                ? `Total belanja melebihi isi dompet sebesar ${formatRupiah(Math.abs(budgetInfo.remaining))}. Kurangi barang sebelum mengantre.`
                : `Total belanja ${formatRupiah(totalCart)} pas dalam batas saku (${formatRupiah(budgetCap)}). Tidak ada drama pembatalan di depan kasir!`}
            </div>
          </div>
        </div>

        {/* Input Nama Sesi */}
        <div className="form-group">
          <label className="form-label">Nama Catatan / Sesi Belanja</label>
          <input
            type="text"
            className="form-input"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
          />
        </div>

        {/* Rincian Ringkas Struk Belanja */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          padding: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 700 }}>
            DAFTAR BARANG YANG SUDAH DI DALAM TROLI ({cartItems.length} ITEM):
          </div>

          <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {cartItems.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.78rem',
                  padding: '4px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
                }}
              >
                <div>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{item.name}</span>
                  <span style={{ color: 'var(--text-dim)', marginLeft: 6 }}>x{item.qty}</span>
                </div>
                <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                  {formatRupiah(item.lineTotal)}
                </div>
              </div>
            ))}
          </div>

          {/* Totals Summary */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed rgba(255, 255, 255, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              <span>Total Harga Asli:</span>
              <span>{formatRupiah(totalOriginal)}</span>
            </div>
            {totalSavings > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#10b981', margin: '3px 0' }}>
                <span>Total Hemat Promo:</span>
                <span>-{formatRupiah(totalSavings)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: '#fff', marginTop: 4 }}>
              <span>TOTAL TAGIHAN:</span>
              <span style={{ color: '#38bdf8' }}>{formatRupiah(totalCart)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button
            type="button"
            className="btn-secondary"
            style={{ flex: 1 }}
            onClick={handleCopyReceipt}
          >
            <Share2 size={16} />
            <span>{copied ? 'Tersalin!' : 'Salin Struk'}</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            style={{ flex: 2 }}
            onClick={handleComplete}
            disabled={cartItems.length === 0}
          >
            <ShoppingBag size={18} />
            <span>Simpan Jadi Riwayat Resmi</span>
          </button>
        </div>

        <div style={{ fontSize: '0.68rem', textAlign: 'center', color: 'var(--text-dim)' }}>
          *Menyimpan sesi ini otomatis memperbarui database harga patokan untuk belanja bulan berikutnya (F-06).
        </div>
      </div>
    </div>
  );
}
