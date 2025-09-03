
-- Add section_name and section_description columns to surat_field_mapping table
ALTER TABLE public.surat_field_mapping 
ADD COLUMN IF NOT EXISTS section_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS section_description TEXT;

-- Create index for better performance when filtering by section
CREATE INDEX IF NOT EXISTS idx_field_mapping_section ON public.surat_field_mapping(section_name);
