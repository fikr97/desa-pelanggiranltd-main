# Panduan Migrasi ke Database Supabase

Dokumen ini menjelaskan langkah-langkah untuk melakukan migrasi skema database lokal ke proyek Supabase Anda sendiri.

## Prasyarat

- [Node.js](https://nodejs.org/) terinstall di sistem Anda
- [Supabase CLI](https://github.com/supabase/cli/releases) terinstall di sistem Anda
- Akun Supabase (dapat dibuat di https://app.supabase.com)
- Proyek Supabase yang telah dibuat

## Langkah-langkah Migrasi

### 1. Instalasi dan Konfigurasi Supabase CLI

```bash
# Install Supabase CLI
# Untuk Windows
winget install supabase

# Alternatif: Download dari https://github.com/supabase/cli/releases
```

### 2. Login ke Akun Supabase Anda

```bash
supabase login
```

### 3. Buat Proyek Baru di Supabase (jika belum ada)

- Kunjungi https://app.supabase.com
- Klik "New Project"
- Isi detail proyek Anda
- Catat Project Reference (REF) yang akan berupa format pendek seperti "abcde12345"

### 4. Hubungkan Proyek Lokal ke Proyek Supabase

```bash
supabase link --project-ref [PROJECT-REF-ANDA]
```

Contoh:
```bash
supabase link --project-ref bzivgwvreceohmqmtvqe
```

### 5. Verifikasi Koneksi dan Konfigurasi

```bash
supabase status
```

### 6. (Opsional) Backup Konfigurasi Lama

Sebelum mengganti konfigurasi, Anda bisa membuat backup:

```bash
cp supabase/config.toml supabase/config.toml.backup
```

### 7. Ganti Konfigurasi Supabase Anda

Anda perlu memperbarui Project ID di file `supabase/config.toml`:

```toml
# Ganti project_id dengan project reference dari proyek Anda
project_id = "PROJECT-REF-ANDA"
```

### 8. Update Konfigurasi API pada Aplikasi

Edit file `src/integrations/supabase/client.ts` dan ganti URL dan key dengan informasi dari proyek baru Anda:

```typescript
// Get URL and key from your Supabase project dashboard
const SUPABASE_URL = "https://[PROJECT-REF].supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "your-anon-key-from-project-dashboard";
```

URL dan key bisa Anda dapatkan dari dashboard Supabase:
- Settings > Project Settings
- Copy "Project URL" untuk SUPABASE_URL
- Copy "anon key" dari "API Keys" untuk SUPABASE_PUBLISHABLE_KEY

### 9. Push Migrasi ke Database Supabase

Pastikan semua file migrasi ada di direktori `supabase/migrations/`, kemudian jalankan:

```bash
supabase db push
```

Perintah ini akan menerapkan semua file migrasi secara berurutan ke database Supabase Anda.

### 10. Uji Aplikasi

Setelah migrasi selesai, uji aplikasi untuk memastikan semuanya berjalan dengan benar:

```bash
npm install
npm run dev
```

## Troubleshooting

### Jika terjadi error saat push migrasi:
1. Pastikan Anda terhubung ke proyek yang benar
2. Periksa hak akses database
3. Pastikan tidak ada konflik skema

### Jika aplikasi tidak bisa mengakses database:
1. Pastikan URL dan key sudah benar
2. Pastikan RLS (Row Level Security) disesuaikan
3. Periksa apakah API tidak diblokir

## Tips Tambahan

- Jika Anda ingin menggunakan database lokal untuk pengembangan, jalankan perintah: `supabase start`
- Anda juga bisa menampilkan informasi API dari proyek Supabase Anda dengan: `supabase db pull`
- Untuk rollback migrasi: `supabase migration repair --version [version]`

## Struktur Database

Proyek ini memiliki beberapa tabel utama:

1. `penduduk` - Data penduduk desa
2. `wilayah` - Struktur wilayah (dusun, RW, RT)
3. `info_desa` - Informasi umum desa
4. `perangkat_desa` - Data perangkat desa
5. `surat` - Template dan data surat
6. `form_tugas` - Formulir untuk berbagai tugas administrasi
7. `berita` - Berita dan pengumuman desa
8. `notifications` - Sistem notifikasi
9. `role_permissions` - Izin akses berdasarkan peran

Semua migrasi disimpan dalam direktori `supabase/migrations/` dalam urutan kronologis.