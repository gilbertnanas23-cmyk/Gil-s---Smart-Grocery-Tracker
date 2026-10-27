import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Check,
  Search,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
  Equal,
  Sparkles,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { CATEGORIES, UNITS, DEFAULT_STORES } from '../data/defaultProducts';
import { formatRupiah } from '../utils/formatters';
import { calculateTieredDiscount, compareHistoricalPrice } from '../utils/calculations';
import { getLocalStore, getLocalDate, getTodayLocalDateString } from '../services/storage';

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
  const [store, setStore] = useState(() => getLocalStore());
  const [isCustomStore, setIsCustomStore] = useState(false);
  const [customStoreName, setCustomStoreName] = useState('');
  const [date, setDate] = useState(() => getLocalDate());
  const [validationError, setValidationError] = useState('');

  // Prefill when editing or opening
  useEffect(() => {
    setValidationError('');
    if (editItem) {
      setName(editItem.name || '');
      setCategory(editItem.category || 'pokok');
      setUnit(editItem.unit || 'pcs');
      setQty(editItem.qty || 1);
      setUnitPrice(editItem.unitPrice ? String(editItem.unitPrice) : '');
      setLastMonthPrice(editItem.lastMonthPrice ? String(editItem.lastMonthPrice) : '');
      setDiscountString(editItem.discountString || '');

      const currentItemStore = editItem.store || getLocalStore();
      if (DEFAULT_STORES.includes(currentItemStore)) {
        setStore(currentItemStore);
        setIsCustomStore(false);
        setCustomStoreName('');
      } else {
        setStore('CUSTOM');
        setIsCustomStore(true);
        setCustomStoreName(currentItemStore);
      }

      setDate(editItem.date || getLocalDate());
    } else {
      // Reset form default
      setName('');
      setCategory('pokok');
      setUnit('pcs');
      setQty(1);
      setUnitPrice('');
      setLastMonthPrice('');
      setDiscountString('');

      const defaultSavedStore = getLocalStore();
      if (DEFAULT_STORES.includes(defaultSavedStore)) {
        setStore(defaultSavedStore);
        setIsCustomStore(false);
        setCustomStoreName('');
      } else {
        setStore('CUSTOM');
        setIsCustomStore(true);
        setCustomStoreName(defaultSavedStore);
      }

      setDate(getLocalDate() || getTodayLocalDateString());
    }
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  const activeStoreName = isCustomStore ? customStoreName.trim() : store;

  // Filter catalog suggestions based on input & store preference
  const catalogSuggestions = catalog.filter(c => {
    if (!name.trim()) return false;
    return c.name.toLowerCase().includes(name.toLowerCase().trim());
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
    if (suggested.store && DEFAULT_STORES.includes(suggested.store)) {
      setStore(suggested.store);
      setIsCustomStore(false);
    }
  };

  // Calculations for preview
  const numPrice = Number(unitPrice) || 0;
  const numLastPrice = lastMonthPrice ? Number(lastMonthPrice) : null;
  const discountRes = calculateTieredDiscount(numPrice, discountString);
  const netPrice = discountRes.finalPrice;
  const lineTotal = netPrice * (Number(qty) || 1);
  const comparison = compareHistoricalPrice(numPrice, numLastPrice, activeStoreName, activeStoreName);

  const handleStoreChange = (e) => {
    const val = e.target.value;
    if (val === 'CUSTOM') {
      setIsCustomStore(true);
      setStore('CUSTOM');
    } else {
      setIsCustomStore(false);
      setStore(val);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    // Validasi Aktif Bahasa Indonesia (F-01)
    if (!name.trim()) {
      setValidationError('Silakan masukkan nama produk belanja Anda.');
      return;
    }

    if (isCustomStore && !customStoreName.trim()) {
      setValidationError('Silakan ketik nama toko atau pilih salah satu toko dari daftar.');
      return;
    }

    const priceNum = Number(unitPrice);
    if (unitPrice === '' || isNaN(priceNum) || priceNum < 0) {
      setValidationError('Harga satuan wajib diisi angka valid dan tidak boleh bernilai negatif.');
      return;
    }

    const qtyNum = Number(qty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setValidationError('Kuantitas (Qty) barang minimal 1.');
      return;
    }

    if (!date) {
      setValidationError('Tanggal transaksi belanja wajib dipilih.');
      return;
    }

    const finalStoreToSave = isCustomStore ? customStoreName.trim() : store;

    const itemData = {
      id: editItem ? editItem.id : `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      category,
      unit,
      qty: Math.max(1, Math.round(qtyNum)),
      unitPrice: priceNum,
      lastMonthPrice: numLastPrice,
      discountString: discountString.trim(),
      store: finalStoreToSave,
      date: date,
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
          <button className="icon-btn" onClick={onClose} title="Tutup">
            <X size={18} />
          </button>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="login-alert error" style={{ marginBottom: 14 }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{validationError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* F-01: Lokasi / Toko Belanja & Tanggal Transaksi */}
          <div className="form-row-2col" style={{ marginBottom: 12 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={13} color="var(--primary-light)" />
                  <span>Toko / Lokasi</span>
                </span>
              </label>
              <select
                className="form-select"
                value={isCustomStore ? 'CUSTOM' : store}
                onChange={handleStoreChange}
                required
              >
                {DEFAULT_STORES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="CUSTOM">+ Toko Lainnya (Ketik Manual)...</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={13} color="var(--primary-light)" />
                  <span>Tanggal Transaksi</span>
                </span>
              </label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Custom Store Input Field (jika memilih opsi '+ Toko Lainnya') */}
          {isCustomStore && (
            <div className="form-group" style={{ marginTop: 2, marginBottom: 12 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Ketik nama toko belanja (misal: Lotte Mart Puri Indah, Pasar Kopro)..."
                value={customStoreName}
                onChange={(e) => setCustomStoreName(e.target.value)}
                autoFocus
                required
              />
            </div>
          )}

          {/* Nama Produk with Suggestion Autocomplete */}
          <div className="form-group">
            <label className="form-label">
              <span>Nama Produk / Kebutuhan Pokok</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Ketik nama barang</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Beras Ramos Super 5kg, Minyak 2L, Telur..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            {/* Catalog quick matching pills */}
            {catalogSuggestions.length > 0 && (
              <div className="suggestion-pills-row">
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Saran cepat:</span>
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
                inputMode="numeric"
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
                inputMode="numeric"
                className="form-input"
                placeholder="Misal: 74000"
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
                <span>Harga Bulan Lalu ({activeStoreName})</span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Opsional</span>
              </label>
              <input
                type="number"
                min="0"
                step="500"
                inputMode="numeric"
                className="form-input"
                placeholder="Misal: 74000"
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
                placeholder="Misal: 50% + 20% atau 20%"
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
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Pratinjau ({activeStoreName} • {date}):
                </span>
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
          <button type="submit" className="btn-primary" style={{ width: '100%', height: 46 }}>
            <Check size={18} />
            <span>{editItem ? 'Simpan Perubahan' : 'Masukkan ke Troli Belanja'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddItemModal;
