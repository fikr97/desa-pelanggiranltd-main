# Panduan Implementasi Fitur Visibilitas Formulir Berdasarkan Dusun (Versi 3 Opsi - Full Access)

## Ringkasan
Fitur ini memungkinkan admin untuk mengatur visibilitas formulir tugas dengan 3 opsi:

1. **"Tampilkan ke Semua Dusun"** (`visibilitas_dusun = 'semua'`)  
   - Semua kadus dari semua dusun bisa melihat dan mengisi form
   - Kadus hanya bisa melihat data penduduk dari dusun mereka sendiri
   - Kadus hanya bisa mengisi data untuk penduduk dari dusun mereka sendiri

2. **"Tampilkan ke Dusun Tertentu"** (`visibilitas_dusun = 'tertentu'`)  
   - Hanya kadus dari dusun yang dipilih yang bisa melihat dan mengisi form
   - Kadus hanya bisa melihat data penduduk dari dusun mereka sendiri
   - Kadus hanya bisa mengisi data untuk penduduk dari dusun mereka sendiri

3. **"Kadus Bisa Lhat & Isi Semua Data"** (`visibilitas_dusun = 'semua_data'`)  
   - Semua kadus yang bisa mengakses form bisa:
     - ✓ MELIHAT semua data dari semua dusun dalam form tersebut
     - ✓ MENGISI data untuk penduduk dari semua dusun (tidak terbatas pada dusun mereka)
     - ✓ MENGEDIT data penduduk dari semua dusun
   - Ini memberikan akses seperti admin khusus untuk form ini

## Migrasi Database
1. Jalankan file migrasi `20251005163000_all_data_access_form_visibility.sql` di SQL Editor Supabase
2. Migrasi ini akan:
   - Memperbarui constraint kolom `visibilitas_dusun` untuk menyertakan opsi 'semua_data'
   - Memperbarui RLS untuk mendukung akses penuh dalam mode 'semua_data'

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

#### Mode "Kadus Bisa Lihat & Isi Semua Data" ('semua_data'):
- Bisa melihat form
- **Bisa melihat SEMUA data dalam form tersebut** (seperti admin untuk melihat data)
- **Bisa mengisi data untuk penduduk dari semua dusun** (tidak terbatas pada dusun mereka)
- **Bisa mengedit data penduduk dari semua dusun** (dalam form ini saja)

## Perbedaan Utama Antara Mode "Semua Data" dan Akses Admin

**Kadus dalam mode "semua_data":**
- ✓ Bisa LIHAT semua data dalam form tersebut
- ✓ Bisa ISI data untuk semua dusun
- ✓ Bisa EDIT data penduduk dari semua dusun (dalam form ini saja)
- ✗ Tidak bisa DELETE data (hanya admin yang bisa)
- ✗ Tidak bisa mengelola form itu sendiri (membuat/mengedit/hapus form - hanya admin)

**Admin:**
- ✓ Bisa LIHAT semua data
- ✓ Bisa ISI data untuk semua dusun
- ✓ Bisa EDIT semua data
- ✓ Bisa DELETE semua data  
- ✓ Bisa mengelola form itu sendiri

## Implementasi UI

### Form Designer (`FormTugasDesigner.tsx`):
- Menambahkan komponen `DusunVisibilitySettings` di tab pengaturan
- Memungkinkan admin memilih dari 3 opsi visibilitas
- Jika memilih "dusun tertentu", admin dapat memilih dusun-dusun yang diizinkan
- Jika memilih "Kadus Bisa Lihat & Isi Semua Data", muncul catatan penjelasan

### Data Entry (`FormDataEntry.tsx`):
- Menambahkan penanganan error untuk kasus akses ditolak
- Menampilkan pesan yang sesuai dengan mode visibilitas

## Gunakan Mode "Semua Data" dengan Bijak
Mode "Kadus Bisa Lihat & Isi Semua Data" memberikan akses yang hampir setara dengan admin untuk form tertentu. Gunakan hanya untuk form:
- Yang memang membutuhkan kolaborasi lintas dusun
- Yang aman untuk diakses dan diedit oleh semua kadus
- Seperti form tugas yang mengumpulkan data secara keseluruhan desa

## Test Case
1. Buat form dengan mode "semua_data", lihat bahwa kadus bisa melihat semua data dan mengisinya
2. Uji bahwa kadus bisa mengisi data untuk penduduk dari dusun manapun dalam mode ini
3. Uji mode "dusun tertentu" untuk memastikan pembatasan tetap berlaku
4. Konfirmasi bahwa admin tetap memiliki akses penuh di semua mode

## Troubleshooting
- Jika kadus tidak bisa mengisi data orang lain dalam mode "semua_data": cek visibilitas_dusun diset ke 'semua_data'
- Jika masih ada batasan akses: pastikan migrasi SQL telah diterapkan dengan benar
- Pastikan kolom-kolom tambahan sudah ditambahkan di tabel form_tugas sebelum menerapkan RLS baru