COMMENT ON COLUMN public.surat_field_mapping.custom_indeks_nomor IS 'DEPRECATED: Use custom_field_options instead.';
COMMENT ON COLUMN public.surat_field_mapping.custom_kode_surat IS 'DEPRECATED: Use custom_field_options instead.';
COMMENT ON COLUMN public.surat_field_mapping.custom_kode_desa IS 'DEPRECATED: Use custom_field_options instead.';
COMMENT ON COLUMN public.surat_field_mapping.custom_field_options IS 'JSONB object to store custom field options, such as { "indeks_nomor": 470, "kode_surat": "UMUM", "kode_desa": "DSA" } for custom letter numbers.';