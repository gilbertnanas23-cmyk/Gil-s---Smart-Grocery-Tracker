import React, { useState } from 'react';
import { X, Sparkles, Scale, Percent, Check, AlertCircle, ShoppingCart } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { calculateTieredDiscount, comparePromos, comparePackSizes } from '../utils/calculations';

export function DiscountCalculatorModal({
  isOpen,
  onClose,
  onApplyToCart,
  initialProduct = null
}) {
  const [activeTab, setActiveTab] = useState('discount'); // 'discount' | 'pack_size'

  // Tab 1: Investigasi Diskon Bertingkat vs Diskon Langsung
  const [basePrice, setBasePrice] = useState(initialProduct ? initialProduct.unitPrice : 35000);
  const [tieredPromo, setTieredPromo] = useState(initialProduct?.discountString || '50% + 20%');
  const [flatDiscount, setFlatDiscount] = useState(15000);

  // Tab 2: Komparasi Kemasan (Unit Price: 1L vs 5L)
  const [packA, setPackA] = useState({ name: 'Kemasan 1 Liter', price: 18000, size: 1, unit: 'liter' });
  const [packB, setPackB] = useState({ name: 'Jerigen 5 Liter', price: 85000, size: 5, unit: 'liter' });

  if (!isOpen) return null;

  // Kalkulasi Tab 1
  const promoComparison = comparePromos(basePrice, tieredPromo, flatDiscount);
  const tieredSteps = calculateTieredDiscount(basePrice, tieredPromo);

  // Kalkulasi Tab 2
  const packComparison = comparePackSizes(
    { nameA: packA.name, priceA: packA.price, sizeA: packA.size, unitA: packA.unit },
    { nameB: packB.name, priceB: packB.price, sizeB: packB.size, unitB: packB.unit }
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag-handle" />

        <div className="modal-header-row">
          <h2 className="modal-title">
            <Sparkles size={20} color="#f59e0b" />
            Investigator Promo & Diskon Pintar
          </h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="promo-tool-tab-switch">
          <button
            className={`promo-tab-btn ${activeTab === 'discount' ? 'active' : ''}`}
            onClick={() => setActiveTab('discount')}
          >
            <Percent size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
            Diskon Bertingkat vs Tunai
          </button>
          <button
            className={`promo-tab-btn ${activeTab === 'pack_size' ? 'active' : ''}`}
            onClick={() => setActiveTab('pack_size')}
          >
            <Scale size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
            Perbandingan Ukuran Kemasan
          </button>
        </div>

        {/* TAB 1: Diskon Bertingkat vs Diskon Tunai (Kasus Botol Sabun Pembersih Lantai) */}
        {activeTab === 'discount' && (
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
              Papan promo supermarket sering menjebak dengan klaim potongan bertumpuk ("50% + 20%").
              Masukkan angka di rak untuk membongkar harga aslinya detik ini juga:
            </div>

            <div className="form-group">
              <label className="form-label">Harga Awal Produk di Rak (Rp)</label>
              <input
                type="number"
                className="form-input"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="Contoh: 35000"
              />
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">
                  <span>Diskon Bertumpuk</span>
                  <span style={{ fontSize: '0.68rem', color: '#f59e0b' }}>contoh: 50%+20%</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={tieredPromo}
                  onChange={(e) => setTieredPromo(e.target.value)}
                  placeholder="50% + 20%"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Opsi Sebelah (Potongan Tunai)</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={flatDiscount}
                  onChange={(e) => setFlatDiscount(e.target.value)}
                  placeholder="Potongan Rp 15000"
                />
              </div>
            </div>

            {/* Live Verdict & Breakdown */}
            <div className={`comparison-result-card winner-${promoComparison.winner}`}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  HASIL PERBANDINGAN REALTIME:
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: promoComparison.winner === 'tiered' ? '#10b981' : '#38bdf8',
                  background: 'rgba(255, 255, 255, 0.08)',
                  padding: '2px 8px',
                  borderRadius: '20px'
                }}>
                  {promoComparison.winner === 'tiered' ? 'Promo Bertingkat Menang' : (promoComparison.winner === 'flat' ? 'Potongan Langsung Menang' : 'Harga Imbang')}
                </span>
              </div>

              <div className="comparison-vs-grid">
                {/* Opsi Bertingkat */}
                <div className={`comparison-option-box ${promoComparison.winner === 'tiered' ? 'is-winner' : ''}`}>
                  <div className="option-box-title">Promo {tieredPromo}</div>
                  <div className="option-box-price">{formatRupiah(promoComparison.tieredFinalPrice)}</div>
                  <div style={{ fontSize: '0.68rem', color: '#10b981', marginTop: 4 }}>
                    Diskon riil: {tieredSteps.effectiveDiscountPercent}% (Bukan {tieredPromo.replace(/[^0-9+]/g, '')}%)
                  </div>
                </div>

                {/* Opsi Tunai */}
                <div className={`comparison-option-box ${promoComparison.winner === 'flat' ? 'is-winner' : ''}`}>
                  <div className="option-box-title">Potongan Langsung {formatRupiah(flatDiscount)}</div>
                  <div className="option-box-price">{formatRupiah(promoComparison.flatFinalPrice)}</div>
                  <div style={{ fontSize: '0.68rem', color: '#38bdf8', marginTop: 4 }}>
                    Hemat: {formatRupiah(promoComparison.flatSavings)}
                  </div>
                </div>
              </div>

              <div className="verdict-banner">
                {promoComparison.explanation}
              </div>
            </div>

            {/* Terapkan ke Troli */}
            {onApplyToCart && (
              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', marginTop: 14 }}
                onClick={() => {
                  onApplyToCart({
                    name: initialProduct?.name || 'Produk Promo Cuci Gudang',
                    unitPrice: Number(basePrice) || 0,
                    discountString: tieredPromo,
                    unit: 'botol',
                    category: 'kebersihan'
                  });
                  onClose();
                }}
              >
                <ShoppingCart size={17} />
                <span>Gunakan Promo Ini di Troli Belanja</span>
              </button>
            )}
          </div>
        )}

        {/* TAB 2: Perbandingan Ukuran Kemasan (Kasus Minyak 1L vs 5L Jerigen) */}
        {activeTab === 'pack_size' && (
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.4 }}>
              Bingung apakah lebih hemat beli kemasan kecil berkali-kali atau langsung beli ukuran jerigen/dus besar?
              Kalkulator satuan ini menghitung harga per satuan baku (liter/kg/pcs) secara otomatis:
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', padding: '12px', marginBottom: 10 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', marginBottom: 8 }}>
                Opsi A (Kemasan Kecil / Eceran)
              </div>
              <div className="form-row-2col">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Harga Total (Rp)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={packA.price}
                    onChange={(e) => setPackA({ ...packA, price: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Isi / Volume (Liter/kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={packA.size}
                    onChange={(e) => setPackA({ ...packA, size: Number(e.target.value) || 1 })}
                  />
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '14px', padding: '12px', marginBottom: 12 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10b981', marginBottom: 8 }}>
                Opsi B (Kemasan Besar / Grosir)
              </div>
              <div className="form-row-2col">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Harga Total (Rp)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={packB.price}
                    onChange={(e) => setPackB({ ...packB, price: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Isi / Volume (Liter/kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-input"
                    value={packB.size}
                    onChange={(e) => setPackB({ ...packB, size: Number(e.target.value) || 1 })}
                  />
                </div>
              </div>
            </div>

            {/* Verdict Perbandingan Satuan */}
            <div className="comparison-result-card" style={{ borderColor: 'var(--primary)' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                HARGA PER SATUAN BAKU:
              </div>

              <div className="comparison-vs-grid">
                <div className={`comparison-option-box ${packComparison.winner === 'A' ? 'is-winner' : ''}`}>
                  <div className="option-box-title">Opsi A (Kemasan Kecil)</div>
                  <div className="option-box-price">{formatRupiah(packComparison.unitPriceA)}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>per satuan baku</div>
                </div>

                <div className={`comparison-option-box ${packComparison.winner === 'B' ? 'is-winner' : ''}`}>
                  <div className="option-box-title">Opsi B (Kemasan Besar)</div>
                  <div className="option-box-price">{formatRupiah(packComparison.unitPriceB)}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>per satuan baku</div>
                </div>
              </div>

              <div className="verdict-banner">
                {packComparison.explanation}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
