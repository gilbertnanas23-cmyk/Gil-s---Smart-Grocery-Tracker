-- ==============================================================================
-- Migration: Tabel Lokasi Toko Kustom Pengguna & Keamanan Row Level Security (RLS)
-- Smart Grocery & Price Tracker - User-Specific Custom Locations (Case-Insensitive)
-- ==============================================================================

-- 1. Buat tabel user_custom_locations jika belum ada
create table if not exists public.user_custom_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Hapus constraint case-sensitive lama jika tabel sudah pernah dibuat sebelumnya
alter table public.user_custom_locations drop constraint if exists unique_user_store_name;

-- 3. Buat Unique Index Case-Insensitive (mencegah duplikasi nama toko per akun terlepas dari huruf kapital/kecil)
create unique index if not exists idx_user_custom_locations_user_lower_name
  on public.user_custom_locations (user_id, lower(trim(name)));

-- 4. Aktifkan Row Level Security (RLS) pada tabel user_custom_locations
alter table public.user_custom_locations enable row level security;

-- Hapus policy lama spesifik tabel ini untuk idempotensi eksekusi
drop policy if exists "Users can view own custom locations" on public.user_custom_locations;
drop policy if exists "Users can insert own custom locations" on public.user_custom_locations;
drop policy if exists "Users can update own custom locations" on public.user_custom_locations;
drop policy if exists "Users can delete own custom locations" on public.user_custom_locations;

-- 5. Policy: Pengguna hanya dapat membaca lokasi milik akun mereka sendiri
create policy "Users can view own custom locations"
  on public.user_custom_locations
  for select
  using (auth.uid() = user_id);

-- 6. Policy: Pengguna hanya dapat menambahkan lokasi untuk akun mereka sendiri
create policy "Users can insert own custom locations"
  on public.user_custom_locations
  for insert
  with check (auth.uid() = user_id);

-- 7. Policy: Pengguna hanya dapat mengubah lokasi milik akun mereka sendiri
create policy "Users can update own custom locations"
  on public.user_custom_locations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 8. Policy: Pengguna hanya dapat menghapus lokasi milik akun mereka sendiri
create policy "Users can delete own custom locations"
  on public.user_custom_locations
  for delete
  using (auth.uid() = user_id);

-- 9. Indeks performa query filter berdasarkan user_id
create index if not exists idx_user_custom_locations_user_id
  on public.user_custom_locations (user_id);
