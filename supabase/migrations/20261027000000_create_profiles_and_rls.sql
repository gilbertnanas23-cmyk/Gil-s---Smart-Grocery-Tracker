-- ==============================================================================
-- Migration: Tabel Profil Pengguna & Keamanan Row Level Security (RLS)
-- Smart Grocery & Price Tracker - Supabase Auth Integration
-- ==============================================================================

-- 1. Buat tabel public.profiles jika belum ada
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Aktifkan Row Level Security (RLS) pada tabel profiles
alter table public.profiles enable row level security;

-- Hapus policy lama jika ada untuk menghindari duplikasi
drop policy if exists "Users can view own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;

-- Policy: User hanya dapat melihat profil mereka sendiri
create policy "Users can view own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

-- Policy: User hanya dapat memperbarui profil mereka sendiri
create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id);

-- Policy: User dapat membuat profil mereka sendiri
create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- 3. Fungsi & Trigger Otomatis: Membuat profil baru setiap kali user mendaftar di Supabase Auth (Email maupun Google OAuth)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, created_at, updated_at)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      ''
    ),
    now(),
    now()
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;

-- Pasang trigger pada tabel auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Perbaiki Keamanan RLS untuk tabel data belanja (grocery_user_data)
-- Memastikan pengguna hanya dapat membaca dan menulis data belanja milik mereka sendiri
create table if not exists public.grocery_user_data (
  user_id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.grocery_user_data enable row level security;

drop policy if exists "Akses Data Belanja" on public.grocery_user_data;
drop policy if exists "User can access own grocery data" on public.grocery_user_data;

create policy "User can access own grocery data"
  on public.grocery_user_data
  for all
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

-- Indeks performa
create index if not exists idx_profiles_id on public.profiles (id);
create index if not exists idx_grocery_user_data_user_id on public.grocery_user_data (user_id);

