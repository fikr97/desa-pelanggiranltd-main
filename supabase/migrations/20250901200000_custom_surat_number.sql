ALTER TABLE public.surat_field_mapping
ADD COLUMN custom_indeks_nomor INTEGER,
ADD COLUMN custom_kode_surat TEXT,
ADD COLUMN custom_kode_desa TEXT;
COMMENT ON COLUMN public.surat_field_mapping.custom_indeks_nomor IS 'Custom Indeks Nomor for a specific placeholder.';
COMMENT ON COLUMN public.surat_field_mapping.custom_kode_surat IS 'Custom Kode Surat for a specific placeholder.';
COMMENT ON COLUMN public.surat_field_mapping.custom_kode_desa IS 'Custom Kode Desa for a specific placeholder.';