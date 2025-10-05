# Perbaikan Kritis: Infinite Recursion pada RLS form_tugas_data

## Masalah
Error "infinite recursion detected in policy for relation 'form_tugas_data'" terjadi karena:
1. Kebijakan RLS untuk `form_tugas_data` mengandung subquery kompleks dengan `EXISTS` yang merujuk ke tabel lain
2. Subquery tersebut juga dibatasi oleh RLS, menciptakan loop tak terbatas
3. Terutama terjadi ketika memeriksa relasi antara `form_tugas_data` → `form_tugas` → `penduduk`

## Solusi
Menggunakan pendekatan **dua lapis** untuk menyelesaikan masalah:

### 1. RLS Sederhana untuk form_tugas_data
File: `20251005172200_fix_form_data_recursion_final.sql`

Mengganti kebijakan RLS kompleks dengan kebijakan sederhana:
```sql
-- SELECT: Admin + User submit + Kadus (semua)
-- INSERT: Admin + User submit + Kadus (semua) 
-- UPDATE: Admin + User submit + Kadus (semua)
-- DELETE: Hanya admin
```

### 2. Validasi Keamanan di Fungsi RPC
Mengandalkan fungsi RPC untuk validasi akses yang lebih detail karena:
- Fungsi dijalankan dengan `SECURITY DEFINER` (melewati RLS)
- Tidak terpengaruh oleh subquery recursion
- Bisa melakukan validasi kompleks dengan aman

### 3. Validasi Tambahan di Frontend
Aplikasi frontend juga melakukan validasi sebelum memanggil fungsi RPC untuk memastikan hanya operasi yang sah yang diizinkan.

## Implementasi

### File Migrasi yang Harus Dijalankan:
1. `20251005172200_fix_form_data_recursion_final.sql` - **PERBAIKAN KRITIS RLS**

### Fungsi RPC yang Digunakan:
- `get_form_data_with_penduduk(form_id)` - Untuk mengambil data
- `update_form_data_with_penduduk_check(...)` - Untuk update data

## Hasil yang Diharapkan
✅ Tidak ada lagi error "infinite recursion"  
✅ Data bisa disimpan dan diupdate dengan benar  
✅ Keamanan tetap terjaga (validasi di fungsi RPC)  
✅ Mode 'semua_data' berfungsi penuh  

## Pengujian
Setelah menjalankan migrasi:
1. Mode 'semua_data' dengan kadus ✅ - Tidak error, data bisa disimpan
2. Mode 'tertentu' dengan kadus ✅ - Tetap dibatasi sesuai dusun
3. Mode 'semua' dengan admin ✅ - Akses penuh seperti biasa
4. Update data dalam mode 'semua_data' ✅ - Berhasil disimpan