import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Equal,
  Sparkles,
  Tag,
  MapPin,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { formatRupiah, formatDate } from '../utils/formatters';
import { calculateTieredDiscount, compareHistoricalPrice } from '../utils/calculations';
import { CATEGORIES } from '../data/defaultProducts';

export function GroceryItemCard({
  item,
  onUpdateQty,
  onDeleteItem,
  onOpenPromoInvestigator,
  onEditItem
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const categoryMeta = CATEGORIES.find(c => c.id === item.category) || {
    name: item.category || 'Lainnya',
    color: '#64748b'
  };

  // Kalkulasi diskon bertingkat untuk harga satuan net
  const discountData = calculateTieredDiscount(item.unitPrice, item.discountString);
  const netUnitPrice = discountData.finalPrice;
  const lineTotal = netUnitPrice * (item.qty || 1);

  // Komparator Fluktuasi Harga vs Bulan Lalu (F-04) dengan konteks toko
  const priceComparison = compareHistoricalPrice(
    item.unitPrice,
    item.lastMonthPrice,
    item.store || '',
    item.store || ''
  );

  const handleConfirmDelete = () => {
    onDeleteItem(item.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="grocery-item-card">
      {/* Inline Delete Confirmation Dialog (UX Safety) */}
      {showDeleteConfirm ? (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '8px'
        }}>
          <div style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 8
          }}>
            <AlertCircle size={15} />
            <span>Hapus "{item.name}" dari daftar belanja?</span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                flex: 1,
                minHeight: '44px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                justifyContent: 'center'
              }}
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleConfirmDelete}
              style={{
                flex: 1,
                minHeight: '44px',
                background: '#ef4444',
                border: 'none',
                borderRadius: '9999px',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <Trash2 size={15} />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Top Row: Info & Badges */}
      <div className="item-top-row">
        <div className="item-info-col">
          <div
            className="item-name"
            onClick={() => onEditItem && onEditItem(item)}
            style={{ cursor: 'pointer' }}
            title="Klik untuk mengedit rincian barang"
          >
            {item.name}
          </div>

          <div className="item-tags-row">
            {/* Store / Lokasi Badge (F-01) */}
            {item.store && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  padding: '2px 7px',
                  borderRadius: '6px'
                }}
                title={`Toko: ${item.store}`}
              >
                <MapPin size={10} />
                <span>{item.store}</span>
              </span>
            )}

            {/* Category Badge */}
            <span
              className="category-tag"
              style={{
                color: categoryMeta.color,
                background: `${categoryMeta.color}18`,
                border: `1px solid ${categoryMeta.color}35`
              }}
            >
              {categoryMeta.name}
            </span>

            {/* Unit Tag */}
            <span className="unit-tag">
              {item.unit || 'pcs'}
            </span>

            {/* Price Fluctuation Realtime Indicator (F-04) */}
            <span
              className={`price-fluctuation-badge ${priceComparison.badgeColor}`}
              title={priceComparison.advice}
            >
              {priceComparison.direction === 'UP' && <ArrowUpRight size={13} strokeWidth={2.6} />}
              {priceComparison.direction === 'DOWN' && <ArrowDownRight size={13} strokeWidth={2.6} />}
              {priceComparison.direction === 'EQUAL' && <Equal size={13} strokeWidth={2.6} />}
              <span>{priceComparison.label}</span>
            </span>

            {/* Tiered Discount Badge (F-03) */}
            {item.discountString && (
              <span
                className="discount-promo-tag"
                onClick={() => onOpenPromoInvestigator && onOpenPromoInvestigator(item)}
                style={{ cursor: 'pointer' }}
                title="Klik untuk membuka rincian kalkulator diskon"
              >
                <Tag size={11} />
                <span>Diskon {item.discountString}</span>
              </span>
            )}
          </div>
        </div>

        {/* Delete Item Button (Touch Target >= 44x44px UX requirement) */}
        {!showDeleteConfirm && (
          <button
            className="item-delete-btn"
            onClick={() => setShowDeleteConfirm(true)}
            title="Hapus barang dari troli"
            style={{
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Advice note jika harga naik tajam */}
      {priceComparison.direction === 'UP' && (
        <div style={{
          fontSize: '0.68rem',
          color: '#f87171',
          background: 'rgba(239, 68, 68, 0.08)',
          padding: '4px 8px',
          borderRadius: '6px',
          marginTop: '6px'
        }}>
          {priceComparison.advice}
        </div>
      )}

      {/* Bottom Row: Pricing & Stepper Ramah Jempol (F-02, Min Target 44x44px) */}
      <div className="item-bottom-row" style={{ marginTop: '8px' }}>
        <div className="item-pricing-box">
          <div className="unit-price-label">
            {item.discountString ? (
              <span>
                <s style={{ color: 'var(--text-dim)', marginRight: 4 }}>{formatRupiah(item.unitPrice)}</s>
                <strong style={{ color: '#10b981' }}>{formatRupiah(netUnitPrice)}</strong>
              </span>
            ) : (
              <span>{formatRupiah(item.unitPrice)} / {item.unit}</span>
            )}
            {item.lastMonthPrice ? (
              <span style={{ color: 'var(--text-dim)', marginLeft: 5, fontSize: '0.65rem' }}>
                (Bln lalu: {formatRupiah(item.lastMonthPrice)})
              </span>
            ) : null}
          </div>

          <div className="line-total-amount">
            {formatRupiah(lineTotal)}
          </div>
        </div>

        {/* Stepper Ramah Jempol (Touch-Friendly Controls >= 44px) */}
        <div className="stepper-control" style={{ minHeight: '44px' }}>
          <button
            className="stepper-btn"
            onClick={() => onUpdateQty(item.id, Math.max(1, (item.qty || 1) - 1))}
            disabled={(item.qty || 1) <= 1}
            style={{
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: (item.qty || 1) <= 1 ? 0.4 : 1
            }}
            title="Kurangi kuantitas"
          >
            <Minus size={16} strokeWidth={2.8} />
          </button>

          <span className="stepper-value" style={{ minWidth: '32px', textAlign: 'center' }}>
            {item.qty || 1}
          </span>

          <button
            className="stepper-btn"
            onClick={() => onUpdateQty(item.id, (item.qty || 1) + 1)}
            style={{
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Tambah kuantitas"
          >
            <Plus size={16} strokeWidth={2.8} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroceryItemCard;
