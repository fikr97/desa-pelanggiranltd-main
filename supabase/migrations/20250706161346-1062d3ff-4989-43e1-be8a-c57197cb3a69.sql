
-- Add multiple_count column to surat_field_mapping table
ALTER TABLE public.surat_field_mapping 
ADD COLUMN IF NOT EXISTS multiple_count integer DEFAULT 2;

-- Update existing multiple records to have default count of 2
UPDATE public.surat_field_mapping 
SET multiple_count = 2 
WHERE is_multiple = true AND multiple_count IS NULL;
