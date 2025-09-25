-- Add is_required field to surat_field_mapping table
ALTER TABLE public.surat_field_mapping 
ADD COLUMN is_required BOOLEAN DEFAULT FALSE;

-- Add comment to document the new column
COMMENT ON COLUMN public.surat_field_mapping.is_required IS 'Menandakan apakah field ini wajib diisi saat membuat surat atau tidak.';