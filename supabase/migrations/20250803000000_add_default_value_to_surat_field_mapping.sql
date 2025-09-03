ALTER TABLE public.surat_field_mapping
ADD COLUMN use_default_value BOOLEAN DEFAULT FALSE,
ADD COLUMN default_value TEXT;
