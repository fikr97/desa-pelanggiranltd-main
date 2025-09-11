-- This script fixes the upsert_surat_field_mappings function.
-- The previous version incorrectly tried to insert into a column named 'nama_field'
-- which does not exist. This version corrects the column name to 'field_name'.

CREATE OR REPLACE FUNCTION upsert_surat_field_mappings(template_id_param UUID, placeholders JSONB)
RETURNS VOID AS $$
BEGIN
  -- First, delete all existing mappings for this template to ensure a clean slate.
  DELETE FROM public.surat_field_mapping WHERE template_id = template_id_param;

  -- Then, insert all the new mappings from the provided JSON array.
  -- This uses the correct column name 'field_name'.
  INSERT INTO public.surat_field_mapping (
    template_id,
    field_name, -- Corrected column name
    deskripsi,
    tipe_data,
    urutan,
    role_field,
    is_multiple,
    is_custom_data,
    options,
    default_value
  )
  SELECT
    template_id_param,
    (placeholder->>'field_name')::TEXT, -- Corrected reference
    (placeholder->>'deskripsi')::TEXT,
    (placeholder->>'tipe_data')::TEXT,
    (placeholder->>'urutan')::INTEGER,
    (placeholder->>'role_field')::TEXT,
    (placeholder->>'is_multiple')::BOOLEAN,
    (placeholder->>'is_custom_data')::BOOLEAN,
    (placeholder->>'options')::JSONB,
    (placeholder->>'default_value')::TEXT
  FROM jsonb_array_elements(placeholders) AS placeholder;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
