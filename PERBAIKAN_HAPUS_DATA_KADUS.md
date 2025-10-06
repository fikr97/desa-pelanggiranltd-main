# Perbaikan Fungsi Hapus (Delete) untuk Role Kadus

## Masalah
Role kadus tidak bisa menghapus data dalam form tugas, meskipun bisa menambah dan melihat data. Hanya role admin yang bisa menghapus data.

## Penyebab
Kebijakan RLS (Row Level Security) DELETE untuk tabel form_tugas_data hanya mengizinkan admin untuk menghapus data, tidak termasuk kadus meskipun dalam mode "semua_data".

Dalam file migrasi awal `20251006120000_fix_form_tugas_rls_for_all_data_mode.sql`, kebijakan DELETE hanya diizinkan untuk admin:
```sql
-- Hanya admin yang bisa delete data
(SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
```

## Solusi
File migrasi `20251006200000_fix_delete_policy_for_all_data_mode.sql` memperbaiki kebijakan RLS DELETE agar:
- Dalam mode "semua_data", kadus bisa menghapus semua data dalam form tersebut
- Dalam mode non-"semua_data", kadus hanya bisa menghapus data dari dusun mereka sendiri
- Tetap menjaga keamanan dengan membatasi akses berdasarkan form dan dusun

## Implementasi
Untuk menerapkan perbaikan ini:
1. Jalankan file `20251006200000_fix_delete_policy_for_all_data_mode.sql` di SQL Editor Supabase
2. Pastikan kebijakan lama dengan nama yang sama sudah dihapus sebelumnya

## Konfirmasi
Setelah implementasi:
- Kadus dalam mode "semua_data" bisa menghapus semua data dalam form tersebut
- Kadus dalam mode non-"semua_data" hanya bisa menghapus data dari dusun mereka
- Admin tetap bisa menghapus semua data
- Akses tetap aman sesuai dengan peran dan pengaturan form