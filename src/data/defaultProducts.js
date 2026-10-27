/**
 * Master Data Awal (Katalog & Riwayat Belanja Bulan Lalu Rian)
 * Dirancang berdasarkan studi kasus belanja bulanan anak kos & skenario rubrik guru
 */

export const CATEGORIES = [
  { id: 'pokok', name: 'Beras & Pokok', icon: 'Wheat', color: '#10b981' },
  { id: 'bumbu', name: 'Minyak & Bumbu', icon: 'Droplets', color: '#f59e0b' },
  { id: 'kebersihan', name: 'Sabun & Kebersihan', icon: 'Sparkles', color: '#3b82f6' },
  { id: 'perawatan', name: 'Perawatan Diri', icon: 'Smile', color: '#8b5cf6' },
  { id: 'instan', name: 'Makanan Instan', icon: 'Flame', color: '#ef4444' },
  { id: 'segar', name: 'Telur & Segar', icon: 'Egg', color: '#ec4899' },
  { id: 'minuman', name: 'Minuman & Kopi', icon: 'Coffee', color: '#06b6d4' },
  { id: 'peralatan', name: 'Peralatan Dapur', icon: 'Utensils', color: '#a855f7' },
  { id: 'lainnya', name: 'Kebutuhan Lainnya', icon: 'Package', color: '#64748b' }
];

export const UNITS = ['kg', 'liter', 'pcs', 'pack', 'botol', 'kaleng', 'dus', 'sachet', 'lusin'];

export const DEFAULT_STORES = [
  'Lotte Mart Puri Indah',
  'Superindo',
  'Alfamart',
  'Indomaret',
  'Hypermart',
  'Pasar Tradisional'
];

export const DEFAULT_MASTER_CATALOG = [
  {
    id: 'prod-beras',
    name: 'Beras Ramos Super 5kg',
    category: 'pokok',
    unit: 'kg',
    packSize: 5,
    store: 'Lotte Mart Puri Indah',
    lastMonthPrice: 74000,
    currentPrice: 80000,
    note: 'Harga beras naik Rp 6.000 dibanding bulan lalu (+8%)'
  },
  {
    id: 'prod-minyak-2l',
    name: 'Minyak Goreng Sawit Pouch 2L',
    category: 'bumbu',
    unit: 'liter',
    packSize: 2,
    store: 'Lotte Mart Puri Indah',
    lastMonthPrice: 43000,
    currentPrice: 43000,
    note: 'Harga stabil di Lotte Mart'
  },
  {
    id: 'prod-telur',
    name: 'Telur Ayam Ras Segar 1kg',
    category: 'segar',
    unit: 'kg',
    packSize: 1,
    store: 'Lotte Mart Puri Indah',
    lastMonthPrice: 30000,
    currentPrice: 26000,
    note: 'Telur turun Rp 4.000 dibanding bulan lalu (-13%)'
  },
  {
    id: 'prod-garam',
    name: 'Garam Dapur Beryodium 500g',
    category: 'bumbu',
    unit: 'pack',
    packSize: 1,
    store: 'Lotte Mart Puri Indah',
    lastMonthPrice: 10000,
    currentPrice: 10000,
    note: 'Harga stabil di Rp 10.000 (0% selisih)'
  },
  {
    id: 'prod-wajan',
    name: 'Wajan Penggorengan Anti Lengket 24cm',
    category: 'peralatan',
    unit: 'pcs',
    packSize: 1,
    store: 'Lotte Mart Puri Indah',
    lastMonthPrice: 120000,
    currentPrice: 100000,
    discountString: '50% + 20%', // Skenario Diskon Bertingkat Guru: 100rb -> 40rb!
    note: 'Promo Cuci Gudang 50% + 20% (Harga akhir Rp 40.000)'
  },
  {
    id: 'prod-pembersih-lantai',
    name: 'Pembersih Lantai Botol 800ml',
    category: 'kebersihan',
    unit: 'botol',
    packSize: 1,
    store: 'Lotte Mart Puri Indah',
    lastMonthPrice: 13500,
    currentPrice: 16000,
    discountString: '50% + 20%',
    note: 'Promo Cuci Gudang 50% + 20%'
  },
  {
    id: 'prod-deterjen',
    name: 'Deterjen Bubuk Anti Noda 800g',
    category: 'kebersihan',
    unit: 'pack',
    packSize: 1,
    store: 'Lotte Mart Puri Indah',
    lastMonthPrice: 18000,
    currentPrice: 17000,
    note: 'Turun Rp 1.000 dibanding bulan lalu'
  },
  {
    id: 'prod-sabun-cuci-piring',
    name: 'Sabun Cuci Piring Jeruk Nipis 750ml',
    category: 'kebersihan',
    unit: 'pack',
    packSize: 1,
    store: 'Lotte Mart Puri Indah',
    lastMonthPrice: 13000,
    currentPrice: 13000,
    note: 'Harga stabil'
  },
  {
    id: 'prod-pasta-gigi',
    name: 'Pasta Gigi Fresh Action 190g',
    category: 'perawatan',
    unit: 'pcs',
    packSize: 1,
    store: 'Lotte Mart Puri Indah',
    lastMonthPrice: 12500,
    currentPrice: 12500,
    note: 'Harga stabil'
  },
  {
    id: 'prod-mie-instan-dus',
    name: 'Mie Instan Goreng Karton (40 pcs)',
    category: 'instan',
    unit: 'dus',
    packSize: 1,
    store: 'Lotte Mart Puri Indah',
    lastMonthPrice: 112000,
    currentPrice: 115000,
    note: 'Naik Rp 3.000'
  }
];

export const INITIAL_CART_ITEMS = [
  {
    id: 'cart-1',
    name: 'Beras Ramos Super 5kg',
    category: 'pokok',
    unit: 'kg',
    qty: 1,
    unitPrice: 80000,
    lastMonthPrice: 74000,
    store: 'Lotte Mart Puri Indah',
    date: new Date().toISOString().split('T')[0],
    discountString: '',
    checked: true
  },
  {
    id: 'cart-2',
    name: 'Minyak Goreng Sawit Pouch 2L',
    category: 'bumbu',
    unit: 'liter',
    qty: 1,
    unitPrice: 43000,
    lastMonthPrice: 43000,
    store: 'Lotte Mart Puri Indah',
    date: new Date().toISOString().split('T')[0],
    discountString: '',
    checked: true
  },
  {
    id: 'cart-3',
    name: 'Telur Ayam Ras Segar 1kg',
    category: 'segar',
    unit: 'kg',
    qty: 1,
    unitPrice: 26000,
    lastMonthPrice: 30000,
    store: 'Lotte Mart Puri Indah',
    date: new Date().toISOString().split('T')[0],
    discountString: '',
    checked: true
  },
  {
    id: 'cart-4',
    name: 'Garam Dapur Beryodium 500g',
    category: 'bumbu',
    unit: 'pack',
    qty: 1,
    unitPrice: 10000,
    lastMonthPrice: 10000,
    store: 'Lotte Mart Puri Indah',
    date: new Date().toISOString().split('T')[0],
    discountString: '',
    checked: true
  }
];

export const INITIAL_PAST_SESSIONS = [
  {
    id: 'session-prev-month',
    title: 'Belanja Bulanan Kos - September 2026',
    store: 'Lotte Mart Puri Indah',
    date: '2026-09-02T10:30:00.000Z',
    budgetCap: 500000,
    totalSpent: 382500,
    totalSaved: 24500,
    itemsCount: 7,
    items: [
      { name: 'Beras Ramos Super 5kg', unit: 'kg', qty: 1, unitPrice: 74000, finalPrice: 74000, lastMonthPrice: 70000, store: 'Lotte Mart Puri Indah' },
      { name: 'Minyak Goreng Sawit Pouch 2L', unit: 'liter', qty: 1, unitPrice: 43000, finalPrice: 43000, lastMonthPrice: 43000, store: 'Lotte Mart Puri Indah' },
      { name: 'Telur Ayam Ras Segar 1kg', unit: 'kg', qty: 1, unitPrice: 30000, finalPrice: 30000, lastMonthPrice: 28000, store: 'Lotte Mart Puri Indah' },
      { name: 'Garam Dapur Beryodium 500g', unit: 'pack', qty: 1, unitPrice: 10000, finalPrice: 10000, lastMonthPrice: 10000, store: 'Lotte Mart Puri Indah' },
      { name: 'Pembersih Lantai Botol 800ml', unit: 'botol', qty: 1, unitPrice: 16000, finalPrice: 13500, lastMonthPrice: 13000, store: 'Lotte Mart Puri Indah' },
      { name: 'Deterjen Bubuk Anti Noda 800g', unit: 'pack', qty: 1, unitPrice: 18000, finalPrice: 18000, lastMonthPrice: 17500, store: 'Lotte Mart Puri Indah' },
      { name: 'Mie Instan Goreng Karton (40 pcs)', unit: 'dus', qty: 1, unitPrice: 112000, finalPrice: 112000, lastMonthPrice: 110000, store: 'Lotte Mart Puri Indah' }
    ]
  }
];
