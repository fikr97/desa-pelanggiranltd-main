-- This script provides the final, corrected version of the upsert_surat_field_mappings function.
-- It is based on the exact table schema provided by the user and will resolve the column errors.

CREATE OR REPLACE FUNCTION public.upsert_surat_field_mappings(template_id_param uuid, placeholders jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- First, delete all existing mappings for this template that are not section markers.
  DELETE FROM public.surat_field_mapping
  WHERE template_id = template_id_param AND field_type <> 'section';

  -- Then, insert all the new mappings from the provided JSON array.
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
  FROM jsonb_array_elements(placeholders) AS p
  -- Ensure we do not try to insert the section markers themselves, only their properties on other fields
  WHERE p->>'field_type' <> 'section';

  -- Separately, handle the section descriptions by updating them on the actual field rows.
  -- This is a bit complex due to the data structure, but we can try to approximate it.
  -- Note: A better data model would be a separate 'sections' table.
  UPDATE public.surat_field_mapping sm
  SET section_description = s.section_description
  FROM (
    SELECT
      p->>'section_name' as section_name,
      p->>'section_description' as section_description
    FROM jsonb_array_elements(placeholders) AS p
    WHERE p->>'field_type' = 'section'
  ) AS s
  WHERE sm.template_id = template_id_param AND sm.section_name = s.section_name;

END;
$function$;
