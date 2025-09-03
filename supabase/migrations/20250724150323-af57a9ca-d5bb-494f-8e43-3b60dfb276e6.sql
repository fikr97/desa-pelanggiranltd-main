-- Remove the unique constraint on nomor_surat to allow duplicate numbers
-- This allows manual numbering to reuse the same numbers
ALTER TABLE public.surat DROP CONSTRAINT IF EXISTS surat_nomor_surat_key;