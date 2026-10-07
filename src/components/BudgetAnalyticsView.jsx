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
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))',
        border: '1px solid var(--border-subtle)',
        borderRadius: '18px',
        padding: '16px',
        marginBottom: '14px'
      }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
          Status Kesehatan Finansial Belanja
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
            {budgetRatio}% Terpakai
          </div>
          <div style={{ fontSize: '0.82rem', color: remainingBudget >= 0 ? '#10b981' : '#ef4444', fontWeight: 700 }}>
            {remainingBudget >= 0 ? `Sisa: ${formatRupiah(remainingBudget)}` : `Minus: ${formatRupiah(Math.abs(remainingBudget))}`}
          </div>
        </div>

        <div className="gauge-progress-track" style={{ marginBottom: 4 }}>
          <div
            className="gauge-progress-fill"
            style={{
              width: `${Math.min(100, budgetRatio)}%`,
              backgroundColor: budgetRatio > 100 ? '#ef4444' : (budgetRatio > 85 ? '#f59e0b' : '#10b981')
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
          <TrendingUp size={16} color="#38bdf8" />
          <span>Radar Fluktuasi Harga vs Bulan Lalu</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '10px 4px' }}>
            <div style={{ color: '#f87171', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontWeight: 800, fontSize: '1.1rem' }}>
              <ArrowUpRight size={16} strokeWidth={3} />
              <span>{countUp}</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#fca5a5', marginTop: 2 }}>Harga Naik</div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '12px', padding: '10px 4px' }}>
            <div style={{ color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontWeight: 800, fontSize: '1.1rem' }}>
              <ArrowDownRight size={16} strokeWidth={3} />
              <span>{countDown}</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#a7f3d0', marginTop: 2 }}>Harga Turun</div>
          </div>

          <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.25)', borderRadius: '12px', padding: '10px 4px' }}>
            <div style={{ color: '#fde047', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, fontWeight: 800, fontSize: '1.1rem' }}>
              <Equal size={16} strokeWidth={3} />
              <span>{countEqual}</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#fef08a', marginTop: 2 }}>Harga Stabil</div>
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
                  <span style={{ color: '#fff', fontWeight: 600 }}>{cat.name}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{formatRupiah(amount)} ({pct}%)</span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'rgba(255, 255, 255, 0.06)', borderRadius: 10, overflow: 'hidden' }}>
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
