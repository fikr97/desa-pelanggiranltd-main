
-- Add multiple_roles column to surat_field_mapping table to store roles/identities
ALTER TABLE public.surat_field_mapping 
ADD COLUMN multiple_roles jsonb DEFAULT '[]'::jsonb;

-- Update existing multiple records to have default roles based on field type
UPDATE public.surat_field_mapping 
SET multiple_roles = '["ayah", "anak"]'::jsonb 
WHERE is_multiple = true AND multiple_roles = '[]'::jsonb AND field_type = 'penduduk';

UPDATE public.surat_field_mapping 
SET multiple_roles = '["tanggal_1", "tanggal_2"]'::jsonb 
WHERE is_multiple = true AND multiple_roles = '[]'::jsonb AND field_type = 'tanggal';

UPDATE public.surat_field_mapping 
SET multiple_roles = '["item_1", "item_2"]'::jsonb 
WHERE is_multiple = true AND multiple_roles = '[]'::jsonb AND field_type = 'custom';
