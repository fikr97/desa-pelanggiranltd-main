# Implementasi Pembatasan Akses Kadus

## Tujuan
Implementasi ini membatasi akses pengguna dengan role `kadus` hanya pada data penduduk yang berada di dusun yang dikelolanya.

## Arsitektur
1. **Database (Supabase)**: Row Level Security (RLS) digunakan untuk membatasi akses data
2. **Frontend**: Aplikasi React secara otomatis mengikuti pembatasan RLS

## File-file yang Diubah

### Migrations:
1. `20251005120000_fix_kadus_penduduk_rls_policies.sql` - Implementasi utama RLS
2. `20251005120001_fix_move_penduduk_function.sql` - Fungsi untuk pemindahan penduduk antar dusun

### Kode Frontend:
1. `src/pages/Penduduk.tsx` - Memperbarui cara pengambilan data penduduk
2. `src/components/SuratGenerator.tsx` - Memperbarui cara pengambilan data penduduk untuk pembuatan surat
3. `src/utils/test-kadus-access.ts` - Fungsi untuk pengujian implementasi

## Cara Kerja

### 1. Row Level Security (RLS) di Database
- **Admin**: Dapat mengakses semua data penduduk
- **Kadus**: Hanya dapat mengakses data penduduk di dusun yang dikelola
- Menggunakan kolom `dusun` di tabel `penduduk` dan `profiles` untuk membandingkan

### 2. Pembatasan Akses
- SELECT: Hanya data penduduk dari dusun yang sesuai yang bisa diambil
- INSERT: Kadus hanya bisa menambahkan penduduk ke dusun mereka
- UPDATE: Kadus hanya bisa mengupdate penduduk di dusun mereka
- DELETE: Kadus hanya bisa menghapus penduduk di dusun mereka

### 3. Pemindahan Penduduk
- Fungsi `move_penduduk` memungkinkan pemindahan penduduk antar dusun
- Hanya admin atau kadus dari dusun asal penduduk yang dapat menggunakan fungsi ini

## Konfigurasi User
- Di tabel `profiles`, kolom `role` menentukan jenis akses
- Kolom `dusun` menentukan wilayah yang dikelola oleh kadus
- Contoh: Kadus dengan `dusun = 'Dusun I'` hanya dapat mengakses penduduk dengan `dusun = 'Dusun I'`

## Pengujian
Gunakan fungsi `testKadusAccess()` untuk memverifikasi bahwa implementasi bekerja sesuai harapan.

## Migrasi ke Database
1. Hapus file `UpdatedSuratGenerator.tsx` karena tidak digunakan
2. Gunakan file `20251005120004_clean_setup_kadus_rls_policies.sql` sebagai migrasi utama
3. Salin isi file tersebut ke SQL Editor Supabase dan jalankan
4. Pastikan RLS diaktifkan untuk tabel `penduduk`
5. Uji dengan akun kadus dan verifikasi bahwa hanya penduduk dari dusun yang sesuai yang terlihat