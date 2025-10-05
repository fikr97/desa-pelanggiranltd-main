# Panduan Implementasi Fitur Visibilitas Formulir Berdasarkan Dusun

## Ringkasan
Fitur ini memungkinkan admin untuk mengatur visibilitas formulir tugas, apakah akan ditampilkan ke:
- **Semua dusun** (default) - semua kadus dari semua dusun bisa melihat dan mengisi form
- **Dusun tertentu** - hanya kadus dari dusun yang dipilih yang bisa melihat dan mengisi form

## Migrasi Database
1. Jalankan file migrasi `20251005162000_minimal_form_visibility_update.sql` di SQL Editor Supabase
2. Migrasi ini akan:
   - Memperbarui kolom `visibilitas_dusun` untuk mendukung 3 opsi ('semua', 'tertentu', 'semua_data')
   - Memperbarui RLS untuk `form_tugas` dan `form_tugas_data` sesuai dengan aturan visibilitas yang baru

## Struktur Kolom Baru
- `visibilitas_dusun`: TEXT ('semua' atau 'tertentu') - menentukan cakupan visibilitas form
- `dusun_terpilih`: TEXT[] - array nama dusun yang dapat mengakses form (jika visibilitas='tertentu')

## Aturan Akses Berdasarkan Role

### Untuk Admin:
- Dapat melihat dan mengelola semua formulir
- Dapat melihat semua data dari semua formulir
- Dapat mengisi formulir untuk penduduk dari dusun manapun

### Untuk Kadus:
- Hanya bisa melihat formulir yang:
  - Memiliki `visibilitas_dusun = 'semua'`, ATAU
  - Memiliki `visibilitas_dusun = 'tertentu'` dan dusun mereka ada dalam `dusun_terpilih`
- Hanya bisa melihat data formulir untuk penduduk dari dusun mereka sendiri
- Hanya bisa mengisi/mengedit data untuk penduduk dari dusun mereka sendiri
- Hanya bisa mengisi formulir yang terbuka untuk dusun mereka

## Implementasi UI

### Form Designer (`FormTugasDesigner.tsx`):
- Menambahkan komponen `DusunVisibilitySettings` di tab pengaturan
- Memungkinkan admin memilih visibilitas: "semua dusun" atau "dusun tertentu"
- Jika memilih "dusun tertentu", admin dapat memilih dusun-dusun yang diizinkan

### Data Entry (`FormDataEntry.tsx`):
- Menambahkan penanganan error untuk kasus akses ditolak
- Menampilkan pesan yang jelas jika user tidak memiliki akses ke form atau data

## Test Case
1. Login sebagai admin, buat form dengan visibilitas "dusun tertentu" (misalnya hanya untuk "Dusun I")
2. Login sebagai kadus Dusun I - harus bisa melihat dan mengisi form
3. Login sebagai kadus Dusun II - tidak boleh bisa melihat form
4. Konfirmasi bahwa data hanya bisa diakses oleh kadus yang berwenang

## Troubleshooting
- Jika kadus tidak bisa melihat form yang seharusnya terlihat: pastikan `visibilitas_dusun` dan `dusun_terpilih` diisi dengan benar
- Jika ada error permission denied: pastikan kolom `dusun` di tabel `profiles` dan `penduduk` terisi dengan benar
- Jika data tidak muncul: pastikan penduduk yang diisi dalam forms berada di dusun yang sama dengan kadus yang mengakses