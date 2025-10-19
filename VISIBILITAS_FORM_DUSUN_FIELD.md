# Panduan Implementasi Visibility Form Tugas Berdasarkan Field Dusun

## Latar Belakang
Sebelumnya, visibilitas data pada form tugas ditentukan berdasarkan dusun dari data penduduk yang terkait. Dengan implementasi baru ini, visibilitas data ditentukan oleh field 'Dusun' yang ada di dalam data form itu sendiri (di dalam field `data_custom`).

## Perubahan Utama

### 1. Fungsi Ekstraksi Dusun
- Dibuat fungsi `get_dusun_from_form_data(data jsonb)` yang mencari berbagai kemungkinan penamaan field Dusun dalam `data_custom`
- Field-field yang dicari (dalam urutan prioritas): 'Dusun', 'dusun', 'DUSUN', 'Ds', 'ds', 'DUSUN_TERKAIT', 'DUSUN_ASAL'

### 2. Kebijakan RLS (Row Level Security) 
- Kebijakan SELECT, INSERT, UPDATE, dan DELETE pada `form_tugas_data` diubah
- Akses data sekarang bergantung pada nilai field Dusun dalam `data_custom` dibandingkan dengan dusun dari user yang login
- Jika field Dusun tidak ditemukan di data, maka sistem tetap memberikan akses (untuk backward compatibility)

### 3. Pola Nama Field yang Didukung
Sistem akan mencari field Dusun dalam `data_custom` dengan nama-nama berikut:
- `Dusun`
- `dusun` 
- `DUSUN`
- `Ds`
- `ds`
- `DUSUN_TERKAIT`
- `DUSUN_ASAL`

## Cara Kerja

### Untuk Admin
- Tetap bisa mengakses semua data tanpa batasan

### Untuk Kadus
- Bisa mengakses data di form dengan mode `semua_data` 
- Bisa mengakses data di form dengan mode `semua` atau `tertentu` jika sesuai dengan aturan visibilitas form
- Hanya bisa mengakses data yang field Dusun-nya sesuai dengan dusun Kadus tersebut

### Contoh
Jika seorang Kadus dari "Dusun Baru" login:
- Dia hanya bisa melihat data form yang memiliki field Dusun dengan nilai "Dusun Baru"
- Dia tidak bisa melihat data form yang memiliki field Dusun dengan nilai "Dusun Tengah" atau "Dusun Utara"

## Implementasi Form
Saat membuat form, pastikan untuk menambahkan field dengan nama 'Dusun' agar visibilitas berfungsi dengan benar:

1. Gunakan field predefined 'Dusun' saat membuat form
2. Atau buat field custom dengan nama 'Dusun' (tipe dropdown dengan pilihan nama-nama dusun)

## Migration yang Diterapkan
File: `20251009150000_final_dusun_field_visibility.sql`

Migration ini:
- Menghapus kebijakan RLS lama
- Membuat fungsi ekstraksi Dusun dari data_custom
- Membuat ulang kebijakan RLS dengan logika baru berdasarkan field Dusun
- Mengaktifkan kembali RLS pada tabel form_tugas_data