
-- Menghapus tabel surat dan surat_template beserta semua objek dependen
DROP TABLE IF EXISTS public.surat CASCADE;
DROP TABLE IF EXISTS public.surat_template CASCADE;

-- Menghapus fungsi untuk generate nomor surat
DROP FUNCTION IF EXISTS public.generate_nomor_surat(text);

-- Menghapus bucket penyimpanan untuk file DOCX surat
DELETE FROM storage.buckets WHERE id = 'surat-docx';
