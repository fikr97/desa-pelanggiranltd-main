# Panduan Implementasi Fitur Visibilitas Formulir Berdasarkan Dusun (Versi 3 Opsi)

## Ringkasan
Fitur ini memungkinkan admin untuk mengatur visibilitas formulir tugas dengan 3 opsi:

1. **"Tampilkan ke Semua Dusun"** (`visibilitas_dusun = 'semua'`)  
   - Semua kadus dari semua dusun bisa melihat dan mengisi form
   - Kadus hanya bisa melihat data penduduk dari dusun mereka sendiri

2. **"Tampilkan ke Dusun Tertentu"** (`visibilitas_dusun = 'tertentu'`)  
   - Hanya kadus dari dusun yang dipilih yang bisa melihat dan mengisi form
   - Kadus hanya bisa melihat data penduduk dari dusun mereka sendiri

3. **"Kadus Bisa Lihat Semua Data"** (`visibilitas_dusun = 'semua_data'`)  
   - Semua kadus yang bisa mengakses form bisa melihat semua data (seperti admin untuk melihat data)
   - Kadus tetap hanya bisa mengisi dan mengedit data untuk penduduk dari dusun mereka sendiri

## Migrasi Database
1. Jalankan file migrasi `20251005162000_minimal_form_visibility_update.sql` di SQL Editor Supabase
2. Migrasi ini akan:
   - Memperbarui constraint kolom `visibilitas_dusun` untuk menyertakan opsi 'semua_data'
   - Memperbarui RLS untuk mendukung ketiga mode visibilitas

## Struktur Kolom
- `visibilitas_dusun`: TEXT ('semua', 'tertentu', atau 'semua_data') - menentukan cakupan visibilitas form
- `dusun_terpilih`: TEXT[] - array nama dusun yang dapat mengakses form (hanya berlaku jika visibilitas='tertentu')

## Aturan Akses Berdasarkan Role dan Mode

### Untuk Admin:
- Dapat melihat dan mengelola semua formulir
- Dapat melihat semua data dari semua formulir
- Dapat mengisi formulir untuk penduduk dari dusun manapun

### Untuk Kadus:

#### Mode "Tampilkan ke Semua Dusun" ('semua'):
- Bisa melihat form
- Hanya bisa melihat data untuk penduduk dari dusun mereka
- Hanya bisa mengisi/mengedit data untuk penduduk dari dusun mereka

#### Mode "Tampilkan ke Dusun Tertentu" ('tertentu'):
- Hanya bisa melihat form JIKA dusun mereka ada dalam `dusun_terpilih`
- Hanya bisa melihat data untuk penduduk dari dusun mereka
- Hanya bisa mengisi/mengedit data untuk penduduk dari dusun mereka

#### Mode "Kadus Bisa Lihat Semua Data" ('semua_data'):
- Bisa melihat form
- Bisa melihat SEMUA data yang ada di form tersebut (seperti admin untuk melihat data)
- MASIH HANYA bisa mengisi/mengedit data untuk penduduk dari dusun mereka

## Implementasi UI

### Form Designer (`FormTugasDesigner.tsx`):
- Menambahkan komponen `DusunVisibilitySettings` di tab pengaturan
- Memungkinkan admin memilih dari 3 opsi visibilitas
- Jika memilih "dusun tertentu", admin dapat memilih dusun-dusun yang diizinkan
- Jika memilih "semua data", muncul catatan penjelasan

### Data Entry (`FormDataEntry.tsx`):
- Menambahkan penanganan error untuk kasus akses ditolak
- Menampilkan pesan yang sesuai dengan mode visibilitas

## Perbedaan Utama Antara Mode "Semua Data" dan Akses Admin

**Kadus dalam mode "semua_data":**
- ✓ Bisa LIHAT semua data dalam form tersebut
- ✗ Tidak bisa EDIT data milik kadus lain (kecuali data penduduk dari dusun mereka)
- ✗ Tidak bisa DELETE data (hanya admin yang bisa)
- ✗ Tidak bisa mengelola form itu sendiri (hanya admin)

**Admin:**
- ✓ Bisa LIHAT semua data
- ✓ Bisa EDIT semua data
- ✓ Bisa DELETE semua data  
- ✓ Bisa mengelola form itu sendiri

## Test Case
1. Buat form dengan mode "semua_data", lihat bahwa kadus bisa melihat semua data
2. Uji bahwa kadus masih hanya bisa mengisi data untuk dusun mereka sendiri meskipun dalam mode "semua_data"
3. Uji mode "dusun tertentu" untuk memastikan hanya dusun terpilih yang bisa akses
4. Konfirmasi bahwa admin tetap memiliki akses penuh di semua mode

## Troubleshooting
- Jika kadus tidak bisa melihat data dalam mode "semua_data": periksa apakah visibilitas_dusun diset ke 'semua_data'
- Jika error permission: pastikan role user dan kolom dusun di profiles dan penduduk terisi dengan benar
- Pastikan kolom-kolom tambahan sudah ditambahkan di tabel form_tugas sebelum menerapkan RLS baru