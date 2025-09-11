-- This script provides the final, corrected version of the upsert_surat_field_mappings function.
-- It fixes a bug where section markers (placeholders with field_type = 'section') were not being saved to the database.
-- This version treats section markers as regular rows, ensuring they are saved and reloaded correctly.

CREATE OR REPLACE FUNCTION public.upsert_surat_field_mappings(template_id_param uuid, placeholders jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- First, delete ALL existing mappings for this template, including old section markers.
  -- This ensures that if a section is deleted on the frontend, it's also deleted here.
  DELETE FROM public.surat_field_mapping
  WHERE template_id = template_id_param;

  -- Then, insert all the new mappings from the provided JSON array.
  -- This version DOES NOT filter out section markers.
  INSERT INTO public.surat_field_mapping (
    template_id,
    field_name,
    field_type,
    field_source,
    field_format,
    is_multiple,
    urutan,
    multiple_count,
    section_name,
    section_description,
    default_value,
    custom_field_options
  )
  SELECT
    template_id_param,
    p->>'field_name',
    p->>'field_type',
    p->>'field_source',
    p->>'field_format',
    (p->>'is_multiple')::boolean,
    (p->>'urutan')::integer,
    (p->>'multiple_count')::integer,
    p->>'section_name',
    p->>'section_description',
    p->>'default_value',
    (p->'custom_field_options')::jsonb
  FROM jsonb_array_elements(placeholders) AS p;

END;
$function$;
