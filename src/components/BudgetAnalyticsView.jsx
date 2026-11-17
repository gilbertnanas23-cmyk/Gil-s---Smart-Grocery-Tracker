import React from 'react';
import { PieChart, TrendingUp, TrendingDown, ShieldAlert, Award, ArrowUpRight, ArrowDownRight, Equal } from 'lucide-react';
import { formatRupiah } from '../utils/formatters';
import { CATEGORIES } from '../data/defaultProducts';
import { calculateHistoricalPriceTrend } from '../utils/calculations';

export function BudgetAnalyticsView({
  cartItems = [],
  budgetCap = 500000,
  sessions = []
}) {
  const totalCart = cartItems.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
  const remainingBudget = budgetCap - totalCart;
  const budgetRatio = Math.round((totalCart / budgetCap) * 100);

  // Group by category
  const categoryTotals = {};
  CATEGORIES.forEach(cat => {
    categoryTotals[cat.id] = 0;
  });

  cartItems.forEach(item => {
    const cat = item.category || 'lainnya';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + (item.lineTotal || 0);
  });

  // Calculate items price trend counts
  let countUp = 0;
  let countDown = 0;
  let countEqual = 0;

  cartItems.forEach(item => {
    if (item.lastMonthPrice) {
      if (item.unitPrice > item.lastMonthPrice) countUp++;
      else if (item.unitPrice < item.lastMonthPrice) countDown++;
      else countEqual++;
    }
  });

  return (
    <div style={{ paddingBottom: '24px' }}>
      {/* Top Health Card */}
      <div style={{
        background: 'var(--bg-gauge)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '18px',
        padding: '16px',
        marginBottom: '14px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
          Status Kesehatan Finansial Belanja
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {budgetRatio}% Terpakai
          </div>
          <div style={{ fontSize: '0.82rem', color: remainingBudget >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 700 }}>
            {remainingBudget >= 0 ? `Sisa: ${formatRupiah(remainingBudget)}` : `Minus: ${formatRupiah(Math.abs(remainingBudget))}`}
          </div>
        </div>

        <div className="gauge-progress-track" style={{ marginBottom: 4 }}>
          <div
            className="gauge-progress-fill"
            style={{
              width: `${Math.min(100, budgetRatio)}%`,
              backgroundColor: budgetRatio > 100 ? 'var(--danger)' : (budgetRatio > 85 ? 'var(--warning)' : 'var(--success)')
            }}
          />
        </div>
      </div>

      {/* Fluktuasi Radar Belanjaan Bulan Ini */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '14px',
        marginBottom: '14px'
      }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <TrendingUp size={16} color="var(--primary)" />
          <span>Radar Fluktuasi Harga vs Bulan Lalu</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
          <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: '12px', padding: '10px 4px' }}>
            <div style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontWeight: 800, fontSize: '1.1rem' }}>
              <ArrowUpRight size={16} strokeWidth={3} />
              <span>{countUp}</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--danger)', marginTop: 2, fontWeight: 600 }}>Harga Naik</div>
          </div>

          <div style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: '12px', padding: '10px 4px' }}>
            <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontWeight: 800, fontSize: '1.1rem' }}>
              <ArrowDownRight size={16} strokeWidth={3} />
              <span>{countDown}</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--success)', marginTop: 2, fontWeight: 600 }}>Harga Turun</div>
          </div>

          <div style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: '12px', padding: '10px 4px' }}>
            <div style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontWeight: 800, fontSize: '1.1rem' }}>
              <Equal size={16} strokeWidth={3} />
              <span>{countEqual}</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--warning)', marginTop: 2, fontWeight: 600 }}>Harga Stabil</div>
          </div>
        </div>
      </div>

      {/* Alokasi Pengeluaran Berdasarkan Kategori */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '16px',
        padding: '14px'
      }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 12 }}>
          Alokasi Pengeluaran per Kategori Kebutuhan
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CATEGORIES.map(cat => {
            const amount = categoryTotals[cat.id] || 0;
            const pct = totalCart > 0 ? Math.round((amount / totalCart) * 100) : 0;
            if (amount === 0) return null;

            return (
              <div key={cat.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: 4 }}>
                  <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{cat.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{formatRupiah(amount)} ({pct}%)</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'var(--border-subtle)', borderRadius: 10, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      backgroundColor: cat.color || 'var(--primary)',
                      borderRadius: 10
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
