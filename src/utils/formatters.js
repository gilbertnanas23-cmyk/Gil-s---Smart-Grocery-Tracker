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
