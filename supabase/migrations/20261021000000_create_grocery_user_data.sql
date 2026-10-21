-- Migration: Inisialisasi tabel grocery_user_data untuk Smart Grocery Tracker
create table if not exists public.grocery_user_data (
  user_id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Aktifkan Row Level Security (RLS)
alter table public.grocery_user_data enable row level security;

-- Policy agar user yang terautentikasi / aplikasi dapat membaca dan menyimpan datanya
drop policy if exists "Akses Data Belanja" on public.grocery_user_data;
create policy "Akses Data Belanja"
  on public.grocery_user_data
  for all
  using (true)
  with check (true);

-- Index pencarian cepat berdasarkan user_id
create index if not exists idx_grocery_user_data_user_id on public.grocery_user_data (user_id);
