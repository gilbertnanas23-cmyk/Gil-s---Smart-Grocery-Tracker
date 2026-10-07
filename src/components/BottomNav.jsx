import React from 'react';
import { ShoppingCart, Sparkles, History, PieChart } from 'lucide-react';

export function BottomNav({ activeTab, onSelectTab, cartItemCount = 0 }) {
  const tabs = [
    { id: 'cart', label: 'Troli Belanja', icon: ShoppingCart, badge: cartItemCount },
    { id: 'promo', label: 'Cek Promo', icon: Sparkles },
    { id: 'history', label: 'Riwayat Struk', icon: History },
    { id: 'analytics', label: 'Analisis Budget', icon: PieChart }
  ];

  return (
    <nav className="bottom-nav-bar" aria-label="Navigasi Utama">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            className={`nav-tab-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(tab.id)}
            aria-current={isActive ? 'page' : undefined}
          >
            <div style={{ position: 'relative' }}>
              <Icon size={20} strokeWidth={isActive ? 2.6 : 2} />
              {tab.badge > 0 && (
                <span className="nav-badge-bubble">
                  {tab.badge}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
