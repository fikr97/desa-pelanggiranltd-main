# Perbaikan Jumlah Data Antara Admin dan Kadus dalam Mode "Semua Data"

## Masalah
Dalam mode "semua_data", jumlah data yang ditampilkan oleh admin dan kadus berbeda. Kadus tidak bisa melihat semua data yang dibuat oleh admin.

## Penyebab
Kebijakan RLS (Row Level Security) SELECT untuk tabel form_tugas_data tidak sepenuhnya mengizinkan kadus untuk melihat semua data dalam form mode "semua_data". Kebijakan hanya memeriksa visibilitas_dusun tetapi tidak memberikan akses penuh ke semua data dalam mode tersebut.

## Solusi
File migrasi `20251006190000_fix_select_policy_for_all_data_mode.sql` memperbaiki kebijakan RLS SELECT agar:
- Dalam mode "semua_data", kadus bisa melihat semua data dari form tersebut, termasuk yang dibuat oleh admin
- Dalam mode non-"semua_data", akses tetap dibatasi berdasarkan dusun

## Implementasi
Untuk menerapkan perbaikan ini:
1. Jalankan file `20251006190000_fix_select_policy_for_all_data_mode.sql` di SQL Editor Supabase
2. Pastikan kebijakan lama dengan nama yang sama sudah dihapus sebelumnya

## Konfirmasi
Setelah implementasi:
- Kadus dalam mode "semua_data" akan melihat jumlah data yang sama dengan admin untuk form tersebut
- Akses tetap aman karena dibatasi berdasarkan form, bukan seluruh sistem
- Mode non-"semua_data" tetap berfungsi sebagaimana mestinya