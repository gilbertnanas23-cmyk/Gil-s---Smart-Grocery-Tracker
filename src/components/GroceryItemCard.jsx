import React from 'react';
import { Plus, Minus, Trash2, ArrowUpRight, ArrowDownRight, Equal, Sparkles, Tag } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { calculateTieredDiscount, compareHistoricalPrice } from '../utils/calculations';
import { CATEGORIES } from '../data/defaultProducts';

export function GroceryItemCard({
  item,
  onUpdateQty,
  onDeleteItem,
  onOpenPromoInvestigator,
  onEditItem
}) {
  const categoryMeta = CATEGORIES.find(c => c.id === item.category) || {
    name: item.category || 'Lainnya',
    color: '#64748b'
  };

  // Kalkulasi diskon bertingkat untuk harga satuan net
  const discountData = calculateTieredDiscount(item.unitPrice, item.discountString);
  const netUnitPrice = discountData.finalPrice;
  const lineTotal = netUnitPrice * (item.qty || 1);

  // Komparator Fluktuasi Harga vs Bulan Lalu (F-04)
  const priceComparison = compareHistoricalPrice(item.unitPrice, item.lastMonthPrice);

  return (
    <div className="grocery-item-card">
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

        {/* Delete Item Button */}
        <button
          className="item-delete-btn"
          onClick={() => onDeleteItem(item.id)}
          title="Hapus barang dari troli"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Advice note jika harga naik tajam */}
      {priceComparison.direction === 'UP' && (
        <div style={{ fontSize: '0.68rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.08)', padding: '3px 8px', borderRadius: '6px' }}>
          {priceComparison.advice}
        </div>
      )}

      {/* Bottom Row: Pricing & Stepper Ramah Jempol (F-02) */}
      <div className="item-bottom-row">
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

        {/* Stepper Ramah Jempol (Touch-Friendly Controls) */}
        <div className="stepper-control">
          <button
            className="stepper-btn"
            onClick={() => onUpdateQty(item.id, Math.max(1, (item.qty || 1) - 1))}
            disabled={(item.qty || 1) <= 1}
            style={{ opacity: (item.qty || 1) <= 1 ? 0.4 : 1 }}
            title="Kurangi kuantitas"
          >
            <Minus size={15} strokeWidth={2.8} />
          </button>

          <span className="stepper-value">
            {item.qty || 1}
          </span>

          <button
            className="stepper-btn"
            onClick={() => onUpdateQty(item.id, (item.qty || 1) + 1)}
            title="Tambah kuantitas"
          >
            <Plus size={15} strokeWidth={2.8} />
          </button>
        </div>
      </div>
    </div>
  );
}
