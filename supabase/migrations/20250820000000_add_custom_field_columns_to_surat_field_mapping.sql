ALTER TABLE public.surat_field_mapping
ADD COLUMN custom_type VARCHAR(50),
ADD COLUMN is_dynamic BOOLEAN DEFAULT TRUE,
ADD COLUMN static_value TEXT;

COMMENT ON COLUMN public.surat_field_mapping.custom_type IS 'Type of custom field: custom-input or custom-textarea.';
COMMENT ON COLUMN public.surat_field_mapping.is_dynamic IS 'Whether the custom field is dynamic (user-filled) or static (pre-defined).';
COMMENT ON COLUMN public.surat_field_mapping.static_value IS 'The static value for the custom field if is_dynamic is false.';