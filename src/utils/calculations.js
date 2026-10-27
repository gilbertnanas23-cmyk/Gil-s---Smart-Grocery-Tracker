/**
 * Utilitas Kalkulasi Matematis & Bisnis Logika Belanja Pintar
 * Sesuai Spesifikasi Rubrik Ujian Harian 2 (DT2): F-01 sampai F-06
 */

/**
 * Parsing dan kalkulasi diskon bertingkat (contoh: "50% + 20%", "30+10", "25%")
 * Rumus Resmi Guru: Harga Akhir = P * (1 - d1) * (1 - d2) * ...
 * @param {number} price - Harga asli
 * @param {string|number} discountInput - Input diskon seperti "50% + 20%" atau 25
 * @returns {{ finalPrice: number, totalSavings: number, effectiveDiscountPercent: number, breakdown: string }}
 */
export function calculateTieredDiscount(price, discountInput) {
  const basePrice = Math.max(0, Number(price) || 0);
  if (!discountInput) {
    return {
      finalPrice: basePrice,
      totalSavings: 0,
      effectiveDiscountPercent: 0,
      breakdown: 'Tanpa Diskon'
    };
  }

  // Jika input adalah string dengan format bertingkat seperti "50% + 20%" atau "50+20"
  const rawStr = String(discountInput).replace(/%/g, '').trim();
  const parts = rawStr.split(/[+,/]/).map(p => parseFloat(p.trim())).filter(p => !isNaN(p) && p > 0);

  if (parts.length === 0) {
    return {
      finalPrice: basePrice,
      totalSavings: 0,
      effectiveDiscountPercent: 0,
      breakdown: 'Tanpa Diskon'
    };
  }

  let currentPrice = basePrice;
  const steps = [];

  for (let i = 0; i < parts.length; i++) {
    const rate = Math.min(100, Math.max(0, parts[i])) / 100;
    const cut = currentPrice * rate;
    currentPrice = Math.max(0, currentPrice - cut);
    steps.push(`${parts[i]}%`);
  }

  const finalPrice = Math.round(currentPrice);
  const totalSavings = basePrice - finalPrice;
  const effectiveDiscountPercent = basePrice > 0 
    ? Math.round(((basePrice - finalPrice) / basePrice) * 1000) / 10 
    : 0;

  return {
    finalPrice,
    totalSavings,
    effectiveDiscountPercent,
    breakdown: steps.length > 1 ? steps.join(' + ') : `${steps[0]}`
  };
}

/**
 * Investigasi Perbandingan Promo:
 * Membandingkan Promo Diskon Bertingkat vs Diskon Langsung Nominal
 */
export function comparePromos(basePrice, tieredDiscountStr, flatDiscountAmount) {
  const p = Math.max(0, Number(basePrice) || 0);
  const tieredResult = calculateTieredDiscount(p, tieredDiscountStr);
  const flatCut = Math.max(0, Number(flatDiscountAmount) || 0);
  const flatFinalPrice = Math.max(0, p - flatCut);
  const flatSavings = Math.min(p, flatCut);

  let winner = 'equal';
  let diff = 0;
  let explanation = '';

  if (tieredResult.finalPrice < flatFinalPrice) {
    winner = 'tiered';
    diff = flatFinalPrice - tieredResult.finalPrice;
    explanation = `Promo bertingkat (${tieredDiscountStr}) LEBIH HEMAT Rp ${diff.toLocaleString('id-ID')} dibanding potongan langsung Rp ${flatCut.toLocaleString('id-ID')}.`;
  } else if (flatFinalPrice < tieredResult.finalPrice) {
    winner = 'flat';
    diff = tieredResult.finalPrice - flatFinalPrice;
    explanation = `JANGAN TERJEBAK! Potongan langsung Rp ${flatCut.toLocaleString('id-ID')} LEBIH HEMAT Rp ${diff.toLocaleString('id-ID')} daripada promo bertingkat (${tieredDiscountStr}).`;
  } else {
    winner = 'equal';
    diff = 0;
    explanation = 'Kedua promo menghasilkan harga akhir yang persis sama.';
  }

  return {
    tieredFinalPrice: tieredResult.finalPrice,
    tieredSavings: tieredResult.totalSavings,
    effectiveTieredPercent: tieredResult.effectiveDiscountPercent,
    flatFinalPrice,
    flatSavings,
    winner,
    diff,
    explanation
  };
}

/**
 * Kalkulasi Unit Price (Harga per Satuan Baku):
 * Membandingkan ukuran kemasan (1L vs 5L)
 */
export function calculateUnitPrice(price, amount, unit = 'pcs') {
  const p = Math.max(0, Number(price) || 0);
  const qty = Math.max(0.001, Number(amount) || 1);
  return p / qty;
}

/**
 * Membandingkan 2 ukuran kemasan
 */
export function comparePackSizes({ nameA, priceA, sizeA, unitA }, { nameB, priceB, sizeB, unitB }) {
  const unitPriceA = calculateUnitPrice(priceA, sizeA, unitA);
  const unitPriceB = calculateUnitPrice(priceB, sizeB, unitB);

  let winner = 'equal';
  let percentDiff = 0;
  let explanation = '';

  if (unitPriceA < unitPriceB) {
    winner = 'A';
    percentDiff = Math.round(((unitPriceB - unitPriceA) / unitPriceB) * 100);
    explanation = `${nameA || 'Opsi A'} lebih hemat ${percentDiff}% per satuan (${unitA}) dibanding ${nameB || 'Opsi B'}!`;
  } else if (unitPriceB < unitPriceA) {
    winner = 'B';
    percentDiff = Math.round(((unitPriceA - unitPriceB) / unitPriceA) * 100);
    explanation = `${nameB || 'Opsi B'} lebih hemat ${percentDiff}% per satuan (${unitB}) dibanding ${nameA || 'Opsi A'}!`;
  } else {
    winner = 'equal';
    explanation = 'Keduanya memiliki harga per satuan yang sebanding.';
  }

  return {
    unitPriceA: Math.round(unitPriceA),
    unitPriceB: Math.round(unitPriceB),
    winner,
    percentDiff,
    explanation
  };
}

/**
 * Deteksi Fluktuasi Harga Realtime vs Riwayat Bulan Lalu (F-04)
 * Mendukung pencocokan toko spesifik (Store-Specific Comparison)
 * @param {number} currentPrice - Harga inputan saat ini
 * @param {number|null} lastMonthPrice - Harga bulan lalu
 * @param {string} store - Nama toko saat ini
 * @param {string} historicalStore - Nama toko pada data riwayat
 */
export function compareHistoricalPrice(currentPrice, lastMonthPrice, store = '', historicalStore = '') {
  const curr = Math.max(0, Number(currentPrice) || 0);
  const prev = lastMonthPrice !== null && lastMonthPrice !== undefined && lastMonthPrice > 0 
    ? Number(lastMonthPrice) 
    : null;

  const isStoreMatched = !store || !historicalStore || store.toLowerCase().trim() === historicalStore.toLowerCase().trim();

  if (prev === null) {
    return {
      status: 'NEW',
      direction: 'NEW',
      symbol: '★',
      label: 'Baru',
      diffNominal: 0,
      diffPercent: 0,
      badgeColor: 'neutral',
      storeMatched: isStoreMatched,
      advice: 'Belum ada riwayat harga bulan lalu. Harga ini akan menjadi patokan untuk bulan depan.'
    };
  }

  const diffNominal = curr - prev;
  const diffPercent = Math.round(((curr - prev) / prev) * 100);
  const storeContextNote = store ? `di ${store}` : '';

  if (diffNominal > 0) {
    return {
      status: 'UP',
      direction: 'UP',
      symbol: '↑',
      label: `Naik ${Math.abs(diffPercent)}%`,
      diffNominal,
      diffPercent,
      badgeColor: 'danger', // Merah
      storeMatched: isStoreMatched,
      advice: `⚠️ Harga NAIK Rp ${diffNominal.toLocaleString('id-ID')} (${diffPercent}%) dibanding bulan lalu ${storeContextNote}. Beli secukupnya!`
    };
  } else if (diffNominal < 0) {
    return {
      status: 'DOWN',
      direction: 'DOWN',
      symbol: '↓',
      label: `Turun ${Math.abs(diffPercent)}%`,
      diffNominal: Math.abs(diffNominal),
      diffPercent: Math.abs(diffPercent),
      badgeColor: 'success', // Hijau
      storeMatched: isStoreMatched,
      advice: `🎉 Harga TURUN Rp ${Math.abs(diffNominal).toLocaleString('id-ID')} (${Math.abs(diffPercent)}%) ${storeContextNote}! Sedang hemat, layak distok.`
    };
  } else {
    return {
      status: 'EQUAL',
      direction: 'EQUAL',
      symbol: '=',
      label: 'Stabil',
      diffNominal: 0,
      diffPercent: 0,
      badgeColor: 'warning', // Stabil (Neutral Amber)
      storeMatched: isStoreMatched,
      advice: `Harga stabil, sama persis dengan bulan lalu ${storeContextNote} (selisih Rp 0).`
    };
  }
}

/**
 * Pengendali Anggaran (Budget Safety Cap) (F-05)
 * Sesuai Rubrik Wajib Guru:
 * - Dibawah 90%: Normal (Hijau)
 * - 90% sampai 100%: Yellow Warning (Kuning)
 * - Diatas 100%: Red Danger Banner (Merah Overbudget)
 * @param {number} totalCart - Total belanjaan saat ini
 * @param {number} budgetCap - Batas uang saku / dompet belanja
 */
export function calculateBudgetStatus(totalCart, budgetCap) {
  const total = Math.max(0, Number(totalCart) || 0);
  const cap = Math.max(1, Number(budgetCap) || 1);
  const percentage = Math.round((total / cap) * 100);
  const remaining = cap - total;

  let status = 'SAFE';
  let badgeText = 'Aman';
  let alertMessage = '';
  let colorTheme = '#10b981'; // Green

  if (percentage > 100) {
    status = 'OVERBUDGET';
    badgeText = 'LEWAT BUDGET!';
    colorTheme = '#ef4444'; // Red
    alertMessage = `🚨 DARURAT KASIR! Total belanjaan melampaui dompet sebesar Rp ${Math.abs(remaining).toLocaleString('id-ID')}. Batalkan beberapa item sebelum mengantre!`;
  } else if (percentage >= 90) {
    status = 'WARNING';
    badgeText = 'Peringatan 90%';
    colorTheme = '#eab308'; // Yellow
    alertMessage = `⚠️ PERINGATAN KUNING! Belanjaan sudah mencapai ${percentage}% dompet. Sisa uang belanja tinggal Rp ${remaining.toLocaleString('id-ID')}.`;
  } else if (percentage >= 70) {
    status = 'SAFE';
    badgeText = 'Waspada 70%';
    colorTheme = '#10b981'; // Greenish
    alertMessage = `⚡ Terpakai ${percentage}% dari total dompet. Sisa Rp ${remaining.toLocaleString('id-ID')}.`;
  } else {
    status = 'SAFE';
    badgeText = 'Terkendali';
    colorTheme = '#10b981'; // Emerald Green
    alertMessage = `Sisa uang belanja: Rp ${remaining.toLocaleString('id-ID')} (${100 - percentage}% tersedia).`;
  }

  return {
    total,
    cap,
    percentage,
    remaining,
    status,
    badgeText,
    alertMessage,
    colorTheme
  };
}

/**
 * Kalkulasi ringkasan tren fluktuasi harga item di keranjang
 */
export function calculateHistoricalPriceTrend(cartItems = []) {
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

  return { countUp, countDown, countEqual };
}
