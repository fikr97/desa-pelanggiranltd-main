-- MIGRASI: Set default section for existing fields
-- This migration ensures that existing fields without sections are assigned to a default section

-- Update existing form_tugas_fields records to include a default section
UPDATE form_tugas_fields 
SET 
  section_name = 'Umum',
  section_order = 0
WHERE 
  section_id IS NULL 
  AND section_name IS NULL;

-- For any existing fields that might have had section fields but were null
UPDATE form_tugas_fields 
SET 
  section_name = 'Umum'
WHERE 
  section_name IS NULL;