# Panduan Uji Migrasi ke Database Supabase

Dokumen ini menjelaskan cara menguji bahwa migrasi ke database Supabase Anda telah berhasil.

## Verifikasi Struktur Database

### 1. Cek Tabel di Database
Setelah migrasi selesai, Anda dapat memeriksa tabel-tabel yang telah dibuat:
- Buka dashboard Supabase Anda di https://app.supabase.com
- Pilih proyek Anda
- Klik menu "Table Editor" di sidebar kiri
- Pastikan semua tabel berikut telah dibuat:
  - `penduduk`
  - `wilayah`
  - `info_desa`
  - `perangkat_desa`
  - `surat`
  - `surat_field_mapping`
  - `form_tugas`
  - `form_tugas_fields`
  - `form_tugas_data`
  - `berita`
  - `notifications`
  - `role_permissions`
  - `arsip_surat_keluar`
  - dll.

### 2. Cek Isi Data Awal
Beberapa tabel mungkin memiliki data awal. Anda bisa memeriksanya dengan:
- Klik pada masing-masing tabel di "Table Editor"
- Pastikan ada beberapa data contoh seperti data info_desa, wilayah, dan penduduk

## Uji Fungsi dan Row Level Security (RLS)

### 1. Uji Fungsi Database
Beberapa migrasi membuat fungsi-fungsi khusus:
- `move_penduduk` - untuk memindahkan penduduk antar wilayah
- Fungsi RPC untuk akses berdasarkan dusun
- Fungsi untuk generate surat
- dll.

### 2. Uji Row Level Security (RLS)
RLS policies sudah diatur di banyak tabel untuk mengelola akses berdasarkan peran pengguna dan wilayah.

## Uji Koneksi Aplikasi

### 1. Ganti Konfigurasi di Aplikasi
Pastikan Anda sudah mengganti konfigurasi Supabase di `src/integrations/supabase/client.ts` dengan URL dan key dari proyek Supabase Anda.

### 2. Jalankan Aplikasi Lokal
```bash
npm install
npm run dev
```

### 3. Uji Fungsionalitas Dasar
- Coba login ke aplikasi
- Akses data penduduk
- Tambah data penduduk baru
- Coba buat surat
- Cek fitur-fitur lainnya

## Troubleshooting Umum

### Jika Tabel Tidak Muncul
- Pastikan migrasi berhasil dengan: `supabase db push`
- Periksa apakah ada error dalam proses migrasi

### Jika Aplikasi Tidak Bisa Terhubung
- Pastikan URL dan API key benar
- Cek apakah API masih aktif di dashboard Supabase
- Pastikan tidak ada pemblokiran dari firewall

### Jika Terjadi Error RLS
- Periksa apakah RLS policies sudah diterapkan dengan benar
- Beberapa tabel mungkin memerlukan role khusus untuk akses

## Validasi Tambahan

### 1. Gunakan Studio Supabase
Anda juga dapat menggunakan Supabase Studio yang disediakan:
- Secara default tersedia di http://127.0.0.1:54323 setelah menjalankan `supabase start`
- Dari sini Anda bisa mengeksekusi query SQL langsung ke database

### 2. Jalankan Query Validasi
Contoh query untuk memastikan migrasi berhasil:
```sql
-- Cek jumlah tabel
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Cek isi tabel penduduk
SELECT * FROM penduduk LIMIT 5;

-- Cek policy RLS
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

## Kesimpulan

Jika semua langkah di atas berhasil, maka migrasi database ke Supabase Anda telah selesai dengan sukses. Database sekarang siap digunakan untuk aplikasi SIDesa Anda.