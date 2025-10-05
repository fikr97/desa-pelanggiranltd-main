# Urutan Migrasi untuk Perbaikan Form Tugas (Versi Aman)

## Urutan Eksekusi (Wajib Diikuti)
1. `20251005170000_fix_penduduk_recursion_error.sql`
   - MEMPERBAIKI error "infinite recursion" pada RLS penduduk

2. `20251005163000_all_data_access_form_visibility.sql`
   - Mengatur 3 opsi visibilitas form dan RLS untuk form_tugas_data

3. `20251005165000_comprehensive_form_penduduk_functions.sql`
   - Menambahkan fungsi-fungsi pendukung untuk form (tanpa modifikasi RLS kompleks)
   
4. `20251005172200_fix_form_data_recursion_final.sql`
   - **PERBAIKAN KRITIS** error "infinite recursion" pada RLS form_tugas_data
   
5. `20251005173000_fix_function_syntax_error.sql`
   - **PERBAIKAN SYNTAX** error pada fungsi RPC
   
6. `20251005173100_fix_ambiguous_column_reference.sql`
   - **PERBAIKAN REFERENSI KOLOM** yang ambigu pada fungsi RPC
   
7. `20251005173200_fix_all_rpc_functions.sql`
   - **PERBAIKAN TOTAL** semua fungsi RPC dengan error syntax dan referensi kolom
   
8. `20251005174000_emergency_fix_ambiguous_columns.sql`
   - **PERBAIKAN DARURAT** semua error ambigu pada fungsi RPC

## Setelah Migrasi
1. Pastikan tidak ada error di Supabase SQL Editor
2. Lakukan refresh aplikasi
3. Implementasikan perubahan frontend jika diperlukan
4. Uji coba fitur form tugas dengan berbagai role dan mode

## Catatan
- Jika terjadi error duplikasi kebijakan/fungsi, jalankan migrasi satu per satu
- Cadangkan database sebelum menjalankan migrasi secara produksi
- Uji coba di environment staging terlebih dahulu