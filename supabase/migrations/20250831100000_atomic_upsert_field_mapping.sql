CREATE OR REPLACE FUNCTION public.update_surat_field_mapping(template_id_param uuid, placeholders_data jsonb)
RETURNS void AS $$
BEGIN
  -- First, delete all existing mappings for this template.
  DELETE FROM public.surat_field_mapping WHERE template_id = template_id_param;

  -- Check if there is any data to insert.
  if jsonb_array_length(placeholders_data) > 0 then
    -- Then, insert the new mappings from the JSON data.
    INSERT INTO public.surat_field_mapping (
      template_id,
      field_name,
      field_type,
      field_source,
      section_name,
      section_description,
      urutan,
      default_value,
      field_format,
      multiple_count,
      multiple_roles,
      custom_field_type,
      custom_field_options
    )
    SELECT
      template_id_param,
      p->>'field_name',
      p->>'field_type',
      p->>'field_source',
      p->>'section_name',
      p->>'section_description',
      (p->>'urutan')::integer,
      p->>'default_value',
      p->>'field_format',
      (p->>'multiple_count')::integer,
      p->>'multiple_roles',
      p->>'custom_field_type',
      p->'custom_field_options' -- This is a jsonb field
    FROM jsonb_array_elements(placeholders_data) AS p;
  end if;

END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER;