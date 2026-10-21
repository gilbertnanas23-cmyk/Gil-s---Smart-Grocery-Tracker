# 🛒 Smart Grocery & Price Tracker (Single-User Personal Budget Guard)
> **Mobile-First PWA Pengawal Anggaran Belanja Bulanan Pribadi**  
> Dibuat khusus untuk pengawasan anggaran belanja kebutuhan pokok dengan komparasi harga bulan lalu, kalkulator diskon bertingkat, dan **Autentikasi Single-User via Akun Google**.

---

## 🌟 Arsitektur Single-User & Keamanan Data

Aplikasi ini beroperasi dalam model **Single-User Workspace Pribadi**:
1. **Google Email Authentication**: Akses login menggunakan akun Google (Firebase Authentication Google OAuth Popup).
2. **Isolasi Data Pribadi**: Setiap sesi troli belanja, patokan harga bulan lalu, dan riwayat struk digital dienkripsi/disimpan khusus di bawah User ID akun Google terkait (`grocery_users/{userId}`).
3. **Whitelist Single-User (Opsional)**: Pengguna dapat mengunci aplikasi hanya untuk 1 alamat email Google pemilik (contoh: `gilbert.nanas23@gmail.com`). Jika akun Google lain mencoba masuk, akses akan ditolak secara otomatis.
4. **Offline First & Demo Mode**: Tetap dapat digunakan saat berada di lorong supermarket yang minim sinyal internet melalui penyimpanan lokal PWA, dengan sinkronisasi background otomatis ke Firebase Firestore.

---

## 📋 Pemenuhan Spesifikasi Kebutuhan Sistem (SRS: F-01 s/d F-07)

| Kode | Fitur Target | Spesifikasi & Logika Sistem | Status |
|---|---|---|---|
| **F-01** | **Pencatatan Item Belanja Lengkap** | Mencatat nama barang, kategori, satuan baku (kg, liter, pcs, pack, botol, kaleng, dus), kuantitas beli, harga satuan saat ini, serta harga bulan lalu. | ✅ **Terpenuhi** |
| **F-02** | **Perhitungan Kuantitas Otomatis** | Tombol stepper kuantitas (+ / -) ramah jempol. Perubahan kuantitas langsung mengalikan harga satuan secara realtime ke total baris dan total keranjang. | ✅ **Terpenuhi** |
| **F-03** | **Kalkulator Diskon Bertingkat & Investigator Promo** | Rumus matematis diskon bertumpuk: $P \times (1 - d_1) \times (1 - d_2)$ (contoh 50%+20% = diskon 60%, bukan 70%). Dilengkapi perbandingan kemasan (*Unit Price Calculator*: 1L vs 5L). | ✅ **Terpenuhi** |
| **F-04** | **Komparator Harga Realtime vs Bulan Lalu** | Deteksi seketika saat harga diinput: <br>• 🔺 **Panah Merah Naik (↑)**: Peringatan harga naik.<br>• 🟢 **Panah Hijau Turun (↓)**: Rekomendasi hemat/borong.<br>• 🟡 **Tanda Setara (=)**: Harga stabil. | ✅ **Terpenuhi** |
| **F-05** | **Pengendali Anggaran (Safety Cap)** | Progress bar dinamis 3 zona (Aman <70%, Waspada 70-90%, Kritis >90%, Darurat Overbudget >100% berdenyut). Fitur **"Penyelamat Kasir"** memberikan rekomendasi item yang bisa dibatalkan sebelum mengantre. | ✅ **Terpenuhi** |
| **F-06** | **Riwayat & Database Belanja** | Checkout *"Selesai Belanja"* otomatis mengarsipkan sesi struk belanja dan memperbarui patokan harga bulan berikutnya. Dilengkapi ekspor/impor JSON dan sinkronisasi Cloud Firestore. | ✅ **Terpenuhi** |
| **F-07** | **Single-User Google Authentication** | Gerbang otentikasi menggunakan akun Google via Firebase Auth. Avatar akun, nama, email terverifikasi, dan kontrol sesi logout. Mendukung whitelist email pemilik. | ✅ **Terpenuhi** |

---

## 📱 Arsitektur Mobile-First PWA

1. **Format Layar Smartphone**: Lebar maksimal 430px (berada di tengah layar jika dibuka pada laptop/PC dengan bezel smartphone realistis dan kamera punch-hole/Dynamic Island).
2. **Bottom Navigation Bar**: Menu mengambang dengan ikon ramah jempol:
   - 🛒 **Troli Belanja**: Daftar barang aktif + Stepper kuantitas + Budget Safety Gauge.
   - ⚡ **Cek Promo**: Investigator Diskon Bertingkat & Perbandingan Ukuran Kemasan.
   - 📜 **Riwayat Struk**: Struk digital abadi + Database Pencarian Harga Barang.
   - 📊 **Analisis Budget**: Alokasi pengeluaran per kategori kebutuhan pokok.
3. **PWA Standalone (Add to Home Screen)**: Dilengkapi `manifest.webmanifest`, service worker `sw.js` untuk mode offline, dan ikon aplikasi responsif.

---

## 🚀 Panduan Menjalankan Secara Lokal (Node.js)

Pastikan Node.js sudah terpasang di komputer Anda.

1. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
   Aplikasi akan aktif di `http://localhost:5173/`.

2. **Build Versi Produksi**:
   ```bash
   npm run build
   ```

3. **Uji Coba Tampilan Mobile di Chrome**:
   - Buka `http://localhost:5173/` di Google Chrome.
   - Tekan `F12` untuk membuka DevTools.
   - Tekan `Ctrl + Shift + M` (Toggle Device Toolbar) dan pilih perangkat **iPhone 14 Pro** atau **Samsung Galaxy S20**.

---

## ☁️ Integrasi Firebase (Firestore & Google Auth)

Aplikasi menggunakan arsitektur **Hybrid Storage**:
- Berjalan otomatis secara cepat dan offline menggunakan **LocalStorage**.
- Jika ingin autentikasi Google dan sinkronisasi realtime lintas smartphone dan cloud:
  1. Buat proyek di [Firebase Console](https://console.firebase.google.com/).
  2. Aktifkan **Authentication** > **Google** sebagai sign-in provider.
  3. Aktifkan **Cloud Firestore**.
  4. Salin kredensial ke file `.env`:
     ```env
     VITE_FIREBASE_API_KEY=AIzaSy...
     VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your-project
     VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=...
     VITE_FIREBASE_APP_ID=...
     VITE_ALLOWED_GOOGLE_EMAIL=gilbert.nanas23@gmail.com
     ```
  5. Pengaturan juga dapat dimasukkan langsung via menu **Pengaturan (Gear)** di dalam aplikasi tanpa perlu restart server!

---

## ⚡ Integrasi Supabase Cloud (PostgreSQL Database & Auth)

Aplikasi mendukung koneksi langsung ke **Supabase** untuk sinkronisasi database dan autentikasi:

1. Buat proyek baru di [Supabase Dashboard](https://supabase.com/).
2. Buka **SQL Editor** di Supabase dan jalankan script berikut untuk membuat tabel penyimpanan troli:
   ```sql
   create table if not exists grocery_user_data (
     user_id text primary key,
     data jsonb,
     updated_at timestamp with time zone default timezone('utc'::text, now())
   );

   alter table grocery_user_data enable row level security;
   create policy "Akses Data Belanja" on grocery_user_data for all using (true) with check (true);
   ```
3. Salin **Project URL** dan **Anon Public Key** dari menu *Project Settings > API*.
4. Masukkan ke file `.env` atau langsung di menu **Pengaturan (Gear)** di aplikasi:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsIn...
   ```
5. Klik tombol **Uji Koneksi Supabase** untuk memastikan sambungan sukses.

---

## 🌐 Panduan Deployment ke Vercel & Mengapa Tampilan Sebelumnya Belum Terupdate

### Kenapa Vercel Belum Menampilkan Update Terbaru?
1. **Cache PWA / Service Worker Browser**: Aplikasi ini adalah Progressive Web App (PWA) yang menggunakan Service Worker (`sw.js`). Browser menyimpan file HTML/JS lama di Cache Storage lokal.
   - **Solusi**: Tekan **Ctrl + Shift + R** (atau **Ctrl + F5**) di Google Chrome/Edge untuk memuat ulang file terbaru dan membersihkan cache lama.
   - **Solusi Mobile**: Buka menu browser > *Settings* > *Clear Browsing Data* (pilih Cached Images and Files) atau buka di tab Incognito / Private Window.
2. **Auto-Update Service Worker v2**: Kami telah memperbarui `sw.js` ke versi `v2-supabase` dan menambahkan header `no-cache, no-store, must-revalidate` pada `vercel.json` sehingga perubahan berikutnya akan langsung terupdate otomatis.

### Langkah Deploy & Sambungkan ke Vercel:
1. Hubungkan repository GitHub [Gil-s---Smart-Grocery-Tracker](https://github.com/gilbertnanas23-cmyk/Gil-s---Smart-Grocery-Tracker) ke [Vercel](https://vercel.com/):
   - Masuk ke Vercel Dashboard > **Add New...** > **Project**
   - Pilih repositori GitHub Anda.
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
2. Tambahkan Environment Variables di Vercel (*Project Settings > Environment Variables*):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_FIREBASE_API_KEY` (opsional)
   - `VITE_FIREBASE_PROJECT_ID` (opsional)
   - `VITE_ALLOWED_GOOGLE_EMAIL` (opsional)
3. Setiap kali Anda melakukan `git push origin main`, Vercel akan secara otomatis membangun (*auto-build*) dan mempublikasikan versi terbaru dalam hitungan detik!