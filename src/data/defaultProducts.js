/**
 * Master Data Awal (Katalog & Riwayat Belanja Bulan Lalu Rian)
 * Dirancang berdasarkan studi kasus anak kos (beras, minyak, sabun cuci, pasta gigi, mie instan, telur)
 */

export const CATEGORIES = [
  { id: 'pokok', name: 'Beras & Pokok', icon: 'Wheat', color: '#10b981' },
  { id: 'bumbu', name: 'Minyak & Bumbu', icon: 'Droplets', color: '#f59e0b' },
  { id: 'kebersihan', name: 'Sabun & Kebersihan', icon: 'Sparkles', color: '#3b82f6' },
  { id: 'perawatan', name: 'Perawatan Diri', icon: 'Smile', color: '#8b5cf6' },
  { id: 'instan', name: 'Makanan Instan', icon: 'Flame', color: '#ef4444' },
  { id: 'segar', name: 'Telur & Segar', icon: 'Egg', color: '#ec4899' },
  { id: 'minuman', name: 'Minuman & Kopi', icon: 'Coffee', color: '#06b6d4' },
  { id: 'lainnya', name: 'Kebutuhan Lainnya', icon: 'Package', color: '#64748b' }
];

export const UNITS = ['kg', 'liter', 'pcs', 'pack', 'botol', 'kaleng', 'dus', 'sachet', 'lusin'];

export const DEFAULT_MASTER_CATALOG = [
  {
    id: 'prod-beras',
    name: 'Beras Ramos Super 5kg',
    category: 'pokok',
    unit: 'kg',
    packSize: 5,
    lastMonthPrice: 68000,
    currentPrice: 72000,
    note: 'Harga beras naik di pasar grosir'
  },
  {
    id: 'prod-minyak-2l',
    name: 'Minyak Goreng Sawit Pouch 2L',
    category: 'bumbu',
    unit: 'liter',
    packSize: 2,
    lastMonthPrice: 34000,
    currentPrice: 33500,
    note: 'Sedang ada promo turun harga sedikit'
  },
  {
    id: 'prod-minyak-5l',
    name: 'Minyak Goreng Jerigen 5L',
    category: 'bumbu',
    unit: 'liter',
    packSize: 5,
    lastMonthPrice: 85000,
    currentPrice: 85000,
    note: 'Pilihan hemat grosiran'
  },
  {
    id: 'prod-telur',
    name: 'Telur Ayam Ras Segar 1kg',
    category: 'segar',
    unit: 'kg',
    packSize: 1,
    lastMonthPrice: 26000,
    currentPrice: 28500,
    note: 'Telur naik Rp 2.500 dibanding bulan lalu'
  },
  {
    id: 'prod-pembersih-lantai',
    name: 'Pembersih Lantai Botol 800ml',
    category: 'kebersihan',
    unit: 'botol',
    packSize: 1,
    lastMonthPrice: 13500,
    currentPrice: 16000,
    discountString: '50% + 20%', // Kasus Promo Bertingkat Cuci Gudang Rian!
    note: 'Promo Cuci Gudang 50% + 20%'
  },
  {
    id: 'prod-deterjen',
    name: 'Deterjen Bubuk Anti Noda 800g',
    category: 'kebersihan',
    unit: 'pack',
    packSize: 1,
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
    lastMonthPrice: 12500,
    currentPrice: 12500,
    note: 'Harga stabil'
  },
  {
    id: 'prod-sabun-mandi',
    name: 'Sabun Mandi Batang 4x100g Multipack',
    category: 'perawatan',
    unit: 'pack',
    packSize: 1,
    lastMonthPrice: 15500,
    currentPrice: 15000,
    note: 'Turun Rp 500'
  },
  {
    id: 'prod-mie-instan-dus',
    name: 'Mie Instan Goreng Karton (40 pcs)',
    category: 'instan',
    unit: 'dus',
    packSize: 1,
    lastMonthPrice: 112000,
    currentPrice: 115000,
    note: 'Naik Rp 3.000'
  },
  {
    id: 'prod-sarden',
    name: 'Sarden Saus Tomat Kaleng 155g',
    category: 'instan',
    unit: 'kaleng',
    packSize: 1,
    lastMonthPrice: 10500,
    currentPrice: 9500,
    note: 'Diskon hemat'
  },
  {
    id: 'prod-kopi',
    name: 'Kopi Hitam Instan Bag (30 sachet)',
    category: 'minuman',
    unit: 'pack',
    packSize: 1,
    lastMonthPrice: 28000,
    currentPrice: 28000,
    note: 'Harga stabil'
  }
];

export const INITIAL_CART_ITEMS = [
  {
    id: 'cart-1',
    name: 'Beras Ramos Super 5kg',
    category: 'pokok',
    unit: 'kg',
    qty: 1,
    unitPrice: 72000,
    lastMonthPrice: 68000,
    discountString: '',
    checked: true
  },
  {
    id: 'cart-2',
    name: 'Minyak Goreng Sawit Pouch 2L',
    category: 'bumbu',
    unit: 'liter',
    qty: 2,
    unitPrice: 33500,
    lastMonthPrice: 34000,
    discountString: '',
    checked: true
  },
  {
    id: 'cart-3',
    name: 'Telur Ayam Ras Segar 1kg',
    category: 'segar',
    unit: 'kg',
    qty: 1,
    unitPrice: 28500,
    lastMonthPrice: 26000,
    discountString: '',
    checked: true
  },
  {
    id: 'cart-4',
    name: 'Pembersih Lantai Botol 800ml',
    category: 'kebersihan',
    unit: 'botol',
    qty: 1,
    unitPrice: 16000,
    lastMonthPrice: 13500,
    discountString: '50% + 20%', // Potongan bertumpuk
    checked: true
  },
  {
    id: 'cart-5',
    name: 'Deterjen Bubuk Anti Noda 800g',
    category: 'kebersihan',
    unit: 'pack',
    qty: 1,
    unitPrice: 17000,
    lastMonthPrice: 18000,
    discountString: '',
    checked: true
  },
  {
    id: 'cart-6',
    name: 'Pasta Gigi Fresh Action 190g',
    category: 'perawatan',
    unit: 'pcs',
    qty: 1,
    unitPrice: 12500,
    lastMonthPrice: 12500,
    discountString: '',
    checked: true
  },
  {
    id: 'cart-7',
    name: 'Mie Instan Goreng Karton (40 pcs)',
    category: 'instan',
    unit: 'dus',
    qty: 1,
    unitPrice: 115000,
    lastMonthPrice: 112000,
    discountString: '',
    checked: true
  }
];

export const INITIAL_PAST_SESSIONS = [
  {
    id: 'session-prev-month',
    title: 'Belanja Bulanan Kos - September 2026',
    date: '2026-09-02T10:30:00.000Z',
    budgetCap: 500000,
    totalSpent: 382500,
    totalSaved: 24500,
    itemsCount: 7,
    items: [
      { name: 'Beras Ramos Super 5kg', unit: 'kg', qty: 1, finalPrice: 68000, lastMonthPrice: 65000 },
      { name: 'Minyak Goreng Sawit Pouch 2L', unit: 'liter', qty: 2, finalPrice: 68000, lastMonthPrice: 34000 },
      { name: 'Telur Ayam Ras Segar 1kg', unit: 'kg', qty: 1, finalPrice: 26000, lastMonthPrice: 25000 },
      { name: 'Pembersih Lantai Botol 800ml', unit: 'botol', qty: 1, finalPrice: 13500, lastMonthPrice: 13000 },
      { name: 'Deterjen Bubuk Anti Noda 800g', unit: 'pack', qty: 1, finalPrice: 18000, lastMonthPrice: 17500 },
      { name: 'Pasta Gigi Fresh Action 190g', unit: 'pcs', qty: 1, finalPrice: 12500, lastMonthPrice: 12500 },
      { name: 'Mie Instan Goreng Karton (40 pcs)', unit: 'dus', qty: 1, finalPrice: 112000, lastMonthPrice: 110000 }
    ]
  }
];
