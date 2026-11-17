/**
 * Master Data Produk Generik & Pemetaan Satuan Dinamis (Task B2 & B3)
 * Dirancang khusus untuk Grade 12 Informatics DT2 Smart Grocery Tracker
 */

export const GENERIC_PRODUCTS = [
  { name: 'Beras', category: 'pokok', defaultUnit: 'kg' },
  { name: 'Minyak Goreng', category: 'bumbu', defaultUnit: 'pouch/2L' },
  { name: 'Telur', category: 'segar', defaultUnit: 'kg' },
  { name: 'Garam', category: 'bumbu', defaultUnit: 'bungkus/500g' },
  { name: 'Gula Pasir', category: 'pokok', defaultUnit: 'bungkus/1kg' },
  { name: 'Sabun Cuci', category: 'kebersihan', defaultUnit: 'pouch/800ml' },
  { name: 'Sabun Mandi', category: 'perawatan', defaultUnit: 'batang' },
  { name: 'Air Mineral', category: 'minuman', defaultUnit: 'galon/19L' },
  { name: 'Susu', category: 'minuman', defaultUnit: 'kotak/1L' },
  { name: 'Tepung Terigu', category: 'pokok', defaultUnit: 'pack/1kg' },
  { name: 'Mi Instan', category: 'instan', defaultUnit: 'bungkus' },
  { name: 'Kecap', category: 'bumbu', defaultUnit: 'botol/600ml' },
  { name: 'Wajan', category: 'peralatan', defaultUnit: 'pcs' },
  { name: 'Kopi', category: 'minuman', defaultUnit: 'sachet' },
  { name: 'Deterjen', category: 'kebersihan', defaultUnit: 'pack/800g' },
  { name: 'Sabun Cuci Piring', category: 'kebersihan', defaultUnit: 'pouch/800ml' },
  { name: 'Pembersih Lantai', category: 'kebersihan', defaultUnit: 'botol/800ml' },
  { name: 'Pasta Gigi', category: 'perawatan', defaultUnit: 'tube/120g' },
  { name: 'Shampo', category: 'perawatan', defaultUnit: 'botol/170ml' },
  { name: 'Margarin', category: 'bumbu', defaultUnit: 'sachet/200g' },
  { name: 'Saus Sambal', category: 'bumbu', defaultUnit: 'botol/335ml' },
  { name: 'Teh Celup', category: 'minuman', defaultUnit: 'kotak/25 bks' },
  { name: 'Tisu', category: 'kebersihan', defaultUnit: 'pack/250 lbr' }
];

export const STANDARD_UNITS = [
  'pcs',
  'kg',
  'liter',
  'pack',
  'botol',
  'bungkus',
  'sachet',
  'dus'
];

export const PRODUCT_SPECIFIC_UNITS = {
  beras: [
    'kg',
    'karung/5kg',
    'karung/10kg',
    'karung/25kg',
    'pack/1kg',
    'pack/500g'
  ],
  'minyak goreng': [
    'botol/1L',
    'botol/2L',
    'pouch/1L',
    'pouch/2L',
    'jeriken/5L'
  ],
  minyak: [
    'botol/1L',
    'botol/2L',
    'pouch/1L',
    'pouch/2L',
    'jeriken/5L'
  ],
  telur: [
    'butir',
    'lusin',
    'kg',
    'tray/30 butir'
  ],
  garam: [
    'sachet/250g',
    'bungkus/500g',
    'kg'
  ],
  'gula pasir': [
    'bungkus/500g',
    'bungkus/1kg',
    'kg'
  ],
  gula: [
    'bungkus/500g',
    'bungkus/1kg',
    'kg'
  ],
  'sabun cuci piring': [
    'pouch/800ml',
    'botol/450ml',
    'pouch/400ml',
    'sachet/100ml'
  ],
  'sabun cuci': [
    'sachet/100g',
    'pouch/800ml',
    'botol/1L',
    'pack/1kg'
  ],
  deterjen: [
    'pack/800g',
    'pack/1kg',
    'pouch/800ml',
    'sachet/100g'
  ],
  'sabun mandi': [
    'batang',
    'botol/250ml',
    'botol/500ml',
    'pouch/400ml'
  ],
  sabun: [
    'batang',
    'botol/250ml',
    'botol/500ml',
    'pouch/400ml'
  ],
  'air mineral': [
    'botol/600ml',
    'botol/1.5L',
    'galon/19L',
    'dus/24 botol'
  ],
  susu: [
    'kotak/1L',
    'kaleng/370g',
    'botol/1L',
    'sachet/40g'
  ],
  'tepung terigu': [
    'pack/1kg',
    'pack/500g',
    'karung/25kg',
    'kg'
  ],
  tepung: [
    'pack/1kg',
    'pack/500g',
    'karung/25kg',
    'kg'
  ],
  'mi instan': [
    'bungkus',
    'dus/40 bks',
    'pack/5 bks'
  ],
  mi: [
    'bungkus',
    'dus/40 bks',
    'pack/5 bks'
  ],
  mie: [
    'bungkus',
    'dus/40 bks',
    'pack/5 bks'
  ],
  kecap: [
    'botol/600ml',
    'pouch/550ml',
    'botol/135ml',
    'sachet'
  ],
  wajan: [
    'pcs',
    'set'
  ],
  kopi: [
    'sachet',
    'pouch/100g',
    'botol',
    'dus'
  ],
  'pasta gigi': [
    'tube/75g',
    'tube/120g',
    'tube/190g'
  ],
  shampo: [
    'botol/170ml',
    'botol/340ml',
    'sachet'
  ],
  margarin: [
    'sachet/200g',
    'tub/250g',
    'kg'
  ],
  'saus sambal': [
    'botol/335ml',
    'botol/135ml',
    'sachet'
  ],
  saus: [
    'botol/335ml',
    'botol/135ml',
    'sachet'
  ],
  'teh celup': [
    'kotak/25 bks',
    'pack'
  ],
  teh: [
    'kotak/25 bks',
    'pack'
  ],
  tisu: [
    'pack/250 lbr',
    'roll'
  ]
};

/**
 * Mendapatkan daftar satuan yang relevan berdasarkan nama produk yang diketik/dipilih.
 * Untuk produk yang dikenali, HANYA mengembalikan opsi satuan yang sesuai untuk produk tersebut.
 * Untuk produk tidak dikenal, mengembalikan fallback satuan standar.
 * Menjamin satuan yang sedang dipilih pengguna tidak hilang dari daftar opsi.
 */
export function getRecommendedUnits(productName, currentSelectedUnit = null) {
  if (!productName || typeof productName !== 'string' || !productName.trim()) {
    const fallback = [...STANDARD_UNITS];
    if (currentSelectedUnit && currentSelectedUnit !== 'CUSTOM' && !fallback.includes(currentSelectedUnit)) {
      fallback.unshift(currentSelectedUnit);
    }
    return fallback;
  }

  const clean = productName.toLowerCase().trim();

  // Cari kecocokan kunci produk terpanjang terlebih dahulu
  let matchedUnits = null;
  const keys = Object.keys(PRODUCT_SPECIFIC_UNITS).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (clean.includes(k)) {
      matchedUnits = PRODUCT_SPECIFIC_UNITS[k];
      break;
    }
  }

  // Jika produk dikenali, kembalikan HANYA satuan kurasi spesifik untuk produk tersebut!
  if (matchedUnits && Array.isArray(matchedUnits)) {
    const result = [...matchedUnits];
    // Jika ada satuan aktif yang sudah tersimpan atau dipilih sebelumnya, pertahankan di dropdown
    if (currentSelectedUnit && currentSelectedUnit !== 'CUSTOM' && !result.includes(currentSelectedUnit)) {
      result.push(currentSelectedUnit);
    }
    return result;
  }

  // Fallback untuk produk yang belum dikenali
  const result = [...STANDARD_UNITS];
  if (currentSelectedUnit && currentSelectedUnit !== 'CUSTOM' && !result.includes(currentSelectedUnit)) {
    result.unshift(currentSelectedUnit);
  }
  return result;
}
