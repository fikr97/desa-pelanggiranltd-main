
-- Tabel untuk berita/artikel
create table public.berita (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  isi text not null,
  gambar text,
  slug text not null unique,
  tanggal_publikasi timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  status text default 'published'
);

-- Tabel untuk galeri foto/video
create table public.galeri (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  url_media text not null,
  tipe_media text not null, -- 'foto' atau 'video'
  deskripsi text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  status text default 'published'
);

-- Tabel untuk halaman informasi statik/dinamis
create table public.halaman_informasi (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  isi text not null,
  slug text not null unique,
  urutan integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  status text default 'published'
);

-- Enable RLS (tidak ada policy agar data bisa diakses publik dari frontend, admin tetap kelola via backend)
alter table public.berita enable row level security;
alter table public.galeri enable row level security;
alter table public.halaman_informasi enable row level security;
