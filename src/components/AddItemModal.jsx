import React, { useState, useEffect, useRef } from 'react';
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
  AlertCircle
} from 'lucide-react';
import { CATEGORIES, UNITS } from '../data/defaultProducts';
import {
  GENERIC_PRODUCTS,
  STANDARD_UNITS,
  getRecommendedUnits,
  detectProductCategory,
  getDetectedProductKey
} from '../data/productUnits';
import { formatRupiah } from '../utils/formatters';
import { calculateTieredDiscount, compareHistoricalPrice } from '../utils/calculations';
import { getLocalStore, getLocalDate, getTodayLocalDateString } from '../services/storage';

export function AddItemModal({
  isOpen,
  onClose,
  onSaveItem,
  editItem = null,
  catalog = [],
  customStores = [],
  activeStore = '',
  activeDate = ''
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('pokok');
  const [unit, setUnit] = useState('pcs');
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnitName, setCustomUnitName] = useState('');
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState('');
  const [lastMonthPrice, setLastMonthPrice] = useState('');
  const [discountString, setDiscountString] = useState('');
  const [validationError, setValidationError] = useState('');

  // Resolved store and date:
  // For editing existing items: preserve editItem.store and editItem.date
  // For new items: automatically inherit active store and date from main page
  const resolvedStore = editItem
    ? (editItem.store || activeStore || getLocalStore())
    : (activeStore || getLocalStore());
  const resolvedDate = editItem
    ? (editItem.date || activeDate || getLocalDate())
    : (activeDate || getLocalDate() || getTodayLocalDateString());
  const activeStoreName = resolvedStore;
  const date = resolvedDate;

  // Searchable generic product combobox states
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const productComboboxRef = useRef(null);

  // Category auto-sync & manual edit protection
  const isCategoryManuallyModifiedRef = useRef(false);
  const lastDetectedProductKeyRef = useRef('');

  // Close combobox when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (productComboboxRef.current && !productComboboxRef.current.contains(e.target)) {
        setIsProductDropdownOpen(false);
        setActiveSuggestionIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Prefill when editing or opening
  useEffect(() => {
    setValidationError('');
    setIsProductDropdownOpen(false);
    setActiveSuggestionIndex(-1);

    if (editItem) {
      setName(editItem.name || '');
      setCategory(editItem.category || 'pokok');
      isCategoryManuallyModifiedRef.current = true;
      lastDetectedProductKeyRef.current = getDetectedProductKey(editItem.name || '');

      const existingUnit = editItem.unit || 'pcs';
      const recommended = getRecommendedUnits(editItem.name || '');
      const allKnownUnits = [...new Set([...recommended, ...STANDARD_UNITS, ...UNITS])];
      
      if (allKnownUnits.includes(existingUnit)) {
        setUnit(existingUnit);
        setIsCustomUnit(false);
        setCustomUnitName('');
      } else {
        setUnit('CUSTOM');
        setIsCustomUnit(true);
        setCustomUnitName(existingUnit);
      }

      setQty(editItem.qty || 1);
      setUnitPrice(editItem.unitPrice ? String(editItem.unitPrice) : '');
      setLastMonthPrice(editItem.lastMonthPrice ? String(editItem.lastMonthPrice) : '');
      setDiscountString(editItem.discountString || '');
    } else {
      // Reset form default
      setName('');
      setCategory('pokok');
      isCategoryManuallyModifiedRef.current = false;
      lastDetectedProductKeyRef.current = '';
      setUnit('pcs');
      setIsCustomUnit(false);
      setCustomUnitName('');
      setQty(1);
      setUnitPrice('');
      setLastMonthPrice('');
      setDiscountString('');
    }
  }, [editItem, isOpen]);

  if (!isOpen) return null;

  // Filter ONLY generic products (without package sizes, quantities, or units)
  const trimmedName = name.trim().toLowerCase();
  const genericSuggestions = GENERIC_PRODUCTS.filter(p => {
    if (!trimmedName) return true; // Show full list on focus
    return p.name.toLowerCase().includes(trimmedName);
  });

  const handleSelectGenericProduct = (product) => {
    setName(product.name);
    const cat = product.category || detectProductCategory(product.name);
    if (cat) {
      setCategory(cat);
      isCategoryManuallyModifiedRef.current = false;
      lastDetectedProductKeyRef.current = getDetectedProductKey(product.name) || product.name.toLowerCase();
    }
    const unitsForProduct = getRecommendedUnits(product.name);
    // If current unit is already in the product's valid curated units, preserve it!
    // Otherwise, select product defaultUnit or the first recommended unit
    if (!unitsForProduct.includes(unit)) {
      setUnit(product.defaultUnit || unitsForProduct[0] || 'pcs');
      setIsCustomUnit(false);
      setCustomUnitName('');
    }
    setIsProductDropdownOpen(false);
    setActiveSuggestionIndex(-1);
  };

  const handleProductNameKeyDown = (e) => {
    if (!isProductDropdownOpen || genericSuggestions.length === 0) {
      if (e.key === 'ArrowDown') {
        setIsProductDropdownOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev < genericSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : genericSuggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < genericSuggestions.length) {
        e.preventDefault();
        handleSelectGenericProduct(genericSuggestions[activeSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsProductDropdownOpen(false);
      setActiveSuggestionIndex(-1);
    }
  };

  // Recommended dynamic units based on current product name and current selection
  const dynamicUnits = getRecommendedUnits(name, unit);

  const handleUnitSelectChange = (e) => {
    const val = e.target.value;
    if (val === 'CUSTOM') {
      setIsCustomUnit(true);
      setUnit('CUSTOM');
    } else {
      setIsCustomUnit(false);
      setUnit(val);
      setCustomUnitName('');
    }
  };

  // Calculations for preview
  const numPrice = Number(unitPrice) || 0;
  const numLastPrice = lastMonthPrice ? Number(lastMonthPrice) : null;
  const discountRes = calculateTieredDiscount(numPrice, discountString);
  const netPrice = discountRes.finalPrice;
  const lineTotal = netPrice * (Number(qty) || 1);
  const comparison = compareHistoricalPrice(numPrice, numLastPrice, activeStoreName, activeStoreName);

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    // Validasi Aktif Bahasa Indonesia (F-01)
    if (!name.trim()) {
      setValidationError('Silakan masukkan nama produk belanja Anda.');
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

    const finalUnitToSave = (unit === 'CUSTOM' || isCustomUnit) ? (customUnitName.trim() || 'pcs') : unit;

    const itemData = {
      id: editItem ? editItem.id : `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      category,
      unit: finalUnitToSave,
      qty: Math.max(1, Math.round(qtyNum)),
      unitPrice: priceNum,
      lastMonthPrice: numLastPrice,
      discountString: discountString.trim(),
      store: resolvedStore,
      date: resolvedDate,
      checked: editItem && editItem.checked !== undefined ? editItem.checked : true
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

        <form onSubmit={handleSubmit} className="add-item-modal-form">
          {/* F-01 / Task B2: Nama Produk with Searchable Generic Combobox Dropdown */}
          <div
            className="form-group"
            ref={productComboboxRef}
            style={{ position: 'relative', zIndex: isProductDropdownOpen ? 30 : 1 }}
          >
            <label className="form-label">
              <span>Nama Produk / Kebutuhan Pokok</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Ketik atau pilih dari daftar</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Contoh: Beras, Minyak Goreng, Telur, Sabun..."
              value={name}
              onChange={(e) => {
                const newName = e.target.value;
                setName(newName);
                setIsProductDropdownOpen(true);
                setActiveSuggestionIndex(-1);

                // Auto-sync category based on typed product name
                const detectedCat = detectProductCategory(newName);
                const detectedKey = getDetectedProductKey(newName);
                if (detectedCat) {
                  if (!isCategoryManuallyModifiedRef.current || (detectedKey && detectedKey !== lastDetectedProductKeyRef.current)) {
                    setCategory(detectedCat);
                    lastDetectedProductKeyRef.current = detectedKey;
                    isCategoryManuallyModifiedRef.current = false;
                  }
                }

                // Auto-sync unit if current unit is not compatible with the newly typed product
                if (!isCustomUnit) {
                  const newUnits = getRecommendedUnits(newName);
                  if (newUnits.length > 0 && !newUnits.includes(unit)) {
                    setUnit(newUnits[0]);
                  }
                }
              }}
              onFocus={() => setIsProductDropdownOpen(true)}
              onKeyDown={handleProductNameKeyDown}
              autoComplete="off"
              required
            />

            {/* Combobox Dropdown Menu with Generic Products Only */}
            {isProductDropdownOpen && genericSuggestions.length > 0 && (
              <div className="product-combobox-dropdown">
                <div className="combobox-dropdown-header">
                  <Tag size={12} />
                  <span>Katalog Kebutuhan Pokok Generik</span>
                </div>
                <div className="combobox-dropdown-list">
                  {genericSuggestions.map((item, idx) => {
                    const isSelected = idx === activeSuggestionIndex;
                    return (
                      <div
                        key={item.name}
                        className={`combobox-dropdown-item ${isSelected ? 'active' : ''}`}
                        onClick={() => handleSelectGenericProduct(item)}
                        onMouseEnter={() => setActiveSuggestionIndex(idx)}
                      >
                        <div className="combobox-item-name">{item.name}</div>
                        <div className="combobox-item-badge">{item.defaultUnit}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Kategori & Satuan (Task B3: Dynamic Product-Specific Units + Custom Unit) */}
          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  isCategoryManuallyModifiedRef.current = true;
                }}
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
                value={isCustomUnit ? 'CUSTOM' : unit}
                onChange={handleUnitSelectChange}
              >
                {dynamicUnits.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
                <option value="CUSTOM">+ Custom / Tulis Sendiri...</option>
              </select>
            </div>
          </div>

          {/* Inline Custom Unit input field when 'CUSTOM' selected */}
          {isCustomUnit && (
            <div className="form-group" style={{ marginTop: -4, marginBottom: 14 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Ketik satuan sendiri (misal: ikat, karton, sisir)..."
                value={customUnitName}
                onChange={(e) => setCustomUnitName(e.target.value)}
                autoFocus
                required
              />
            </div>
          )}

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
                  <span>Harga Bulan Lalu</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>Opsional</span>
                </div>
                {activeStoreName && (
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '100%' }}>
                    ({activeStoreName})
                  </span>
                )}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
                  <span>Promo / Diskon</span>
                </div>
                <span className="form-label-hint" style={{ display: 'block' }}>contoh: 50%+20%</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Contoh: 20%"
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
              marginBottom: '18px'
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
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {formatRupiah(lineTotal)}
                  </div>
                </div>
              </div>

              {comparison.direction === 'UP' && (
                <div className="price-advice-note danger">
                  {comparison.advice}
                </div>
              )}
            </div>
          )}

          {/* Submit Action with increased vertical spacing */}
          <div style={{ marginTop: '22px', paddingBottom: '12px' }}>
            <button type="submit" className="btn-primary" style={{ width: '100%', minHeight: 46 }}>
              <Check size={18} />
              <span>{editItem ? 'Simpan Perubahan' : 'Masukkan ke Troli Belanja'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddItemModal;
