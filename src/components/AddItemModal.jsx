import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Search, Tag, ArrowUpRight, ArrowDownRight, Equal, Sparkles } from 'lucide-react';
import { CATEGORIES, UNITS } from '../data/defaultProducts';
import { formatRupiah } from '../utils/formatters';
import { calculateTieredDiscount, compareHistoricalPrice } from '../utils/calculations';

export function AddItemModal({
  isOpen,
  onClose,
  onSaveItem,
  editItem = null,
  catalog = []
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('pokok');
  const [unit, setUnit] = useState('pcs');
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [lastMonthPrice, setLastMonthPrice] = useState('');
  const [discountString, setDiscountString] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Prefill when editing
  useEffect(() => {
    if (editItem) {
      setName(editItem.name || '');
      setCategory(editItem.category || 'pokok');
      setUnit(editItem.unit || 'pcs');
      setQty(editItem.qty || 1);
      setUnitPrice(editItem.unitPrice ? String(editItem.unitPrice) : '');
      setLastMonthPrice(editItem.lastMonthPrice ? String(editItem.lastMonthPrice) : '');
      setDiscountString(editItem.discountString || '');
    } else {
      // Reset form
      setName('');
      setCategory('pokok');
      setUnit('pcs');
      setQty(1);
      setUnitPrice('');
      setLastMonthPrice('');
      setDiscountString('');
    }
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  // Filter catalog suggestions based on input
  const catalogSuggestions = catalog.filter(c => {
    if (!name) return false;
    return c.name.toLowerCase().includes(name.toLowerCase());
  }).slice(0, 4);

  const handleSelectSuggestion = (suggested) => {
    setName(suggested.name);
    setCategory(suggested.category || 'pokok');
    setUnit(suggested.unit || 'pcs');
    setLastMonthPrice(suggested.lastMonthPrice ? String(suggested.lastMonthPrice) : '');
    setUnitPrice(suggested.currentPrice ? String(suggested.currentPrice) : (suggested.lastMonthPrice ? String(suggested.lastMonthPrice) : ''));
    if (suggested.discountString) {
      setDiscountString(suggested.discountString);
    }
  };

  // Calculations for preview
  const numPrice = Number(unitPrice) || 0;
  const numLastPrice = lastMonthPrice ? Number(lastMonthPrice) : null;
  const discountRes = calculateTieredDiscount(numPrice, discountString);
  const netPrice = discountRes.finalPrice;
  const lineTotal = netPrice * (Number(qty) || 1);
  const comparison = compareHistoricalPrice(numPrice, numLastPrice);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const itemData = {
      id: editItem ? editItem.id : `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      category,
      unit,
      qty: Math.max(1, Number(qty) || 1),
      unitPrice: numPrice,
      lastMonthPrice: numLastPrice,
      discountString: discountString.trim(),
      checked: true
    };

    onSaveItem(itemData);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag-handle" />

        <div className="modal-header-row">
          <h2 className="modal-title">
            <Plus size={20} color="var(--primary)" />
            {editItem ? 'Edit Item Belanja' : 'Tambah Barang ke Troli'}
          </h2>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Nama Produk with Suggestion Autocomplete */}
          <div className="form-group">
            <label className="form-label">
              <span>Nama Produk / Kebutuhan Pokok</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Ketik nama barang</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Beras Ramos 5kg, Minyak 2L, Sabun..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />

            {/* Catalog quick matching pills */}
            {catalogSuggestions.length > 0 && (
              <div className="suggestion-pills-row">
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Rekomendasi riwayat:</span>
                {catalogSuggestions.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className="suggestion-pill"
                    onClick={() => handleSelectSuggestion(s)}
                  >
                    {s.name} ({formatRupiah(s.lastMonthPrice)})
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Kategori & Satuan */}
          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Satuan</label>
              <select
                className="form-select"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                {UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Kuantitas (Qty) & Harga Satuan Saat Ini */}
          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Kuantitas (Qty)</label>
              <input
                type="number"
                min="1"
                step="1"
                className="form-input"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Harga Satuan (Rp)</span>
              </label>
              <input
                type="number"
                min="0"
                step="500"
                className="form-input"
                placeholder="Misal: 72000"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Harga Bulan Lalu & Diskon Bertingkat */}
          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">
                <span>Harga Bulan Lalu</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Opsional</span>
              </label>
              <input
                type="number"
                min="0"
                step="500"
                className="form-input"
                placeholder="Misal: 68000"
                value={lastMonthPrice}
                onChange={(e) => setLastMonthPrice(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>Promo / Diskon</span>
                <span style={{ fontSize: '0.68rem', color: '#f59e0b' }}>contoh: 50%+20%</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Misal: 50% + 20% atau 25%"
                value={discountString}
                onChange={(e) => setDiscountString(e.target.value)}
              />
            </div>
          </div>

          {/* Realtime Live Preview Card */}
          {numPrice > 0 && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pratinjau Kalkulasi Realtime:</span>
                <span className={`price-fluctuation-badge ${comparison.badgeColor}`}>
                  {comparison.direction === 'UP' && <ArrowUpRight size={12} strokeWidth={2.6} />}
                  {comparison.direction === 'DOWN' && <ArrowDownRight size={12} strokeWidth={2.6} />}
                  {comparison.direction === 'EQUAL' && <Equal size={12} strokeWidth={2.6} />}
                  <span>{comparison.label}</span>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    {discountString ? (
                      <span>Diskon {discountRes.breakdown} (Efektif {discountRes.effectiveDiscountPercent}%)</span>
                    ) : (
                      <span>Harga net per {unit}:</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                    {formatRupiah(netPrice)} / {unit}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Total Baris (Qty x Harga):</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>
                    {formatRupiah(lineTotal)}
                  </div>
                </div>
              </div>

              {comparison.direction === 'UP' && (
                <div style={{ marginTop: 6, fontSize: '0.68rem', color: '#f87171' }}>
                  {comparison.advice}
                </div>
              )}
            </div>
          )}

          {/* Submit Action */}
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>
            <Check size={18} />
            <span>{editItem ? 'Simpan Perubahan' : 'Masukkan ke Troli Belanja'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
