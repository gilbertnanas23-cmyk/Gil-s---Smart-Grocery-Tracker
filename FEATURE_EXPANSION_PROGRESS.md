# CATATAN PROGRES EKSPANSI FITUR — SMART GROCERY TRACKER

## Task 1: Perbaikan Ikon Kalender Pemilih Tanggal (SELESAI)
- Menghilangkan ikon kalender hitam duplikat bawaan browser di sebelah kanan via CSS `::-webkit-calendar-picker-indicator`.
- Menjadikan ikon kalender hijau di sebelah kiri dapat diklik untuk membuka date picker (`showPicker()` dengan fallback `.focus()`).
- Menerapkan perbaikan di layar utama (`App.jsx`) dan modal tambah barang (`AddItemModal.jsx`).
- Mempertahankan persistensi tanggal belanja di `localStorage`.

## Task 2: Implementasi Mode Terang & Gelap / Light & Dark Mode (SELESAI)
- Menggantikan tombol bintang/sparkle kuning di Header dengan kontrol tema intuitif (Ikon Matahari `Sun` saat Dark Mode aktif untuk beralih ke Light Mode, Ikon Bulan `Moon` saat Light Mode aktif untuk beralih ke Dark Mode).
- Fungsi asli tombol sparkle yang digantikan adalah pintasan cepat ke tab "Cek Promo". Fitur ini tetap 100% aman dan tersedia melalui navigasi bawah (`BottomNav.jsx` -> Tab 2 "Cek Promo") dan tombol "Bongkar Promo" pada kartu produk.
- Mengatur variabel CSS terpusat pada `:root` (Dark Mode baseline) dan `[data-theme="light"]` (Light Mode) dengan kontras tinggi, latar belakang off-white yang nyaman di mata, kartu putih bersih, dan aksen hijau emerald yang konsisten.
- Skrip sinkronisasi pra-render ditambahkan ke `index.html` untuk mencegah kedipan layar (*zero theme flashing*).
- Preferensi tema disimpan di `localStorage` (`smart_grocery_theme_v1`) dan default ke Dark Mode jika belum ada preferensi.
- Seluruh sistem autentikasi Supabase, Google OAuth, sinkronisasi realtime, perhitungan diskon, dan kalkulasi dompet anggaran dipertahankan tanpa perubahan.
