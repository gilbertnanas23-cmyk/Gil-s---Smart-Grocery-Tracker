import React, { useState } from 'react';
import { History, Calendar, Search, ArrowUpRight, ArrowDownRight, Equal, Download, Upload, RefreshCw, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';
import { formatRupiah, formatDate } from '../utils/formatters';
import { exportAllData, importAllData } from '../services/storage';

export function HistoryView({
  sessions = [],
  catalog = [],
  onReloadSessionToCart,
  onRefreshData
}) {
  const [activeSubTab, setActiveSubTab] = useState('sessions'); // 'sessions' | 'database'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSessionId, setExpandedSessionId] = useState(null);
  const [exportNotice, setExportNotice] = useState('');

  // Filter master catalog items
  const filteredCatalog = catalog.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleSessionExpand = (id) => {
    setExpandedSessionId(expandedSessionId === id ? null : id);
  };

  const handleExport = () => {
    const data = exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smart_grocery_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice('File backup JSON berhasil diunduh!');
    setTimeout(() => setExportNotice(''), 3000);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result);
        importAllData(parsed);
        if (onRefreshData) onRefreshData();
        setExportNotice('Data belanja berhasil dipulihkan!');
        setTimeout(() => setExportNotice(''), 3000);
      } catch (err) {
        alert('Format file JSON tidak sesuai.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ paddingBottom: '20px' }}>
      {/* Sub Tabs: Riwayat Sesi Belanja vs Basis Data Harga */}
      <div className="promo-tool-tab-switch" style={{ marginBottom: 12 }}>
        <button
          className={`promo-tab-btn ${activeSubTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('sessions')}
        >
          <Calendar size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
          Struk Sesi Bulanan ({sessions.length})
        </button>
        <button
          className={`promo-tab-btn ${activeSubTab === 'database' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('database')}
        >
          <History size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
          Database Harga ({catalog.length})
        </button>
      </div>

      {exportNotice && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.2)',
          border: '1px solid #10b981',
          color: '#34d399',
          padding: '8px 12px',
          borderRadius: '10px',
          fontSize: '0.75rem',
          marginBottom: 10,
          textAlign: 'center'
        }}>
          {exportNotice}
        </div>
      )}

      {/* SUBTAB 1: Riwayat Sesi Struk Belanja Bulanan */}
      {activeSubTab === 'sessions' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Struk digital abadi (bebas buram/hilang):
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={handleExport}
                className="icon-btn"
                style={{ width: 30, height: 30 }}
                title="Ekspor Backup Data JSON"
              >
                <Download size={14} />
              </button>
              <label
                className="icon-btn"
                style={{ width: 30, height: 30, cursor: 'pointer' }}
                title="Impor Backup Data JSON"
              >
                <Upload size={14} />
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleImport}
                />
              </label>
            </div>
          </div>

          {sessions.length === 0 ? (
            <div className="empty-state-box">
              <div className="empty-state-icon">
                <Calendar size={28} />
              </div>
              <div className="empty-state-title">Belum Ada Riwayat Sesi</div>
              <div className="empty-state-desc">
                Selesaikan belanjaan di tab Troli untuk mengarsipkan struk pertama Anda ke database ini.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sessions.map(session => {
                const isExpanded = expandedSessionId === session.id;
                return (
                  <div key={session.id} className="history-session-card">
                    <div
                      className="history-session-header"
                      onClick={() => toggleSessionExpand(session.id)}
                    >
                      <div>
                        <div className="session-title">{session.title}</div>
                        <div className="session-date">{formatDate(session.date)} • {session.itemsCount || session.items?.length || 0} barang</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#38bdf8' }}>
                            {formatRupiah(session.totalSpent)}
                          </div>
                          {session.totalSaved > 0 && (
                            <div style={{ fontSize: '0.68rem', color: '#10b981' }}>
                              Hemat {formatRupiah(session.totalSaved)}
                            </div>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* Expanded Items Drawer */}
                    {isExpanded && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700 }}>
                          Rincian Barang yang Dibeli:
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                          {session.items?.map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.74rem',
                                color: '#e2e8f0',
                                padding: '2px 0'
                              }}
                            >
                              <span>• {item.name} ({item.qty}x)</span>
                              <span>{formatRupiah(item.finalLineTotal || item.finalPrice || (item.unitPrice * item.qty))}</span>
                            </div>
                          ))}
                        </div>

                        {/* Duplikat ke Troli Baru */}
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ width: '100%', padding: '8px 12px', fontSize: '0.78rem' }}
                          onClick={() => onReloadSessionToCart(session)}
                        >
                          <ShoppingCart size={14} />
                          <span>Muat Ulang Barang Ini ke Troli Baru</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: Basis Data Harga Master (Pencarian Harga Bulan Lalu) */}
      {activeSubTab === 'database' && (
        <div>
          {/* Pencarian Barang */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 13, color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Cari harga barang (contoh: Beras, Telur, Sabun)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            Menampilkan patokan harga resmi untuk komparasi supermarket:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredCatalog.map(prod => {
              const prev = prod.lastMonthPrice;
              const curr = prod.currentPrice || prev;
              const diff = curr - prev;

              return (
                <div
                  key={prod.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                      {prod.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                      Satuan: {prod.unit || 'pcs'} • {prod.category}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc' }}>
                      {formatRupiah(curr)}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Bln lalu: {formatRupiah(prev)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
