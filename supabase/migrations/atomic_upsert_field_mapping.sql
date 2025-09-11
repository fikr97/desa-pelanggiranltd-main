-- This script creates a function to atomically update (upsert) all field mappings for a given surat template.

CREATE OR REPLACE FUNCTION upsert_surat_field_mappings(template_id_param UUID, placeholders JSONB)
RETURNS VOID AS $$
BEGIN
  -- First, delete all existing mappings for this template to ensure a clean slate.
  DELETE FROM public.surat_field_mapping WHERE template_id = template_id_param;

  -- Then, insert all the new mappings from the provided JSON array.
  -- The JSONB array should be an array of objects, where each object is a placeholder.
  INSERT INTO public.surat_field_mapping (
    template_id,
    nama_field,
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
    (placeholder->>'nama_field')::TEXT,
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
