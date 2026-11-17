/**
 * Helper Formatters untuk Rupiah, Tanggal, dan Nilai Angka
 */

export function formatRupiah(value) {
  const num = Math.round(Number(value) || 0);
  return `Rp ${num.toLocaleString('id-ID')}`;
}

export function formatNumber(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('id-ID');
}

export function formatDate(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatDateLong(dateString) {
  if (!dateString) return '-';
  const parts = String(dateString).split('-');
  let d;
  if (parts.length === 3) {
    d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  } else {
    d = new Date(dateString);
  }
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
