-- Add missing columns to surat_field_mapping table
ALTER TABLE public.surat_field_mapping
ADD COLUMN IF NOT EXISTS use_default_value BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS default_value TEXT,
ADD COLUMN IF NOT EXISTS custom_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_dynamic BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS static_value TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN public.surat_field_mapping.use_default_value IS 'Whether to use default value for custom fields';
COMMENT ON COLUMN public.surat_field_mapping.default_value IS 'Default value for custom input/textarea fields';
COMMENT ON COLUMN public.surat_field_mapping.custom_type IS 'Type of custom field: custom-input or custom-textarea';
COMMENT ON COLUMN public.surat_field_mapping.is_dynamic IS 'Whether the custom field is dynamic (user-filled) or static (pre-defined)';
COMMENT ON COLUMN public.surat_field_mapping.static_value IS 'The static value for the custom field if is_dynamic is false';

-- Verify the changes
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'surat_field_mapping'
AND table_schema = 'public'
ORDER BY ordinal_position;
