ALTER TABLE public.surat_field_mapping
ADD COLUMN IF NOT EXISTS multiple_count INTEGER,
ADD COLUMN IF NOT EXISTS multiple_roles TEXT,
ADD COLUMN IF NOT EXISTS custom_field_type TEXT,
ADD COLUMN IF NOT EXISTS custom_field_options JSONB;