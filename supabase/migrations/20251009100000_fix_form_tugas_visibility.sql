-- 1. Add visibility columns to the form_tugas table (using the correct column names that match existing RLS policies)
-- Note: We need to update both the visibility columns to use the correct naming convention
-- and then update all the RLS policies to work with the field 'Dusun' in data_custom for form_tugas_data

-- First, make sure the required columns exist
ALTER TABLE public.form_tugas
ADD COLUMN IF NOT EXISTS visibilitas_dusun TEXT DEFAULT 'semua' CHECK (visibilitas_dusun IN ('semua', 'tertentu', 'semua_data')),
ADD COLUMN IF NOT EXISTS dusun_terpilih TEXT[];

-- Add comments for clarity
COMMENT ON COLUMN public.form_tugas.visibilitas_dusun IS 'Controls form visibility: semua, tertentu, semua_data';
COMMENT ON COLUMN public.form_tugas.dusun_terpilih IS 'List of dusun names allowed to see the form if visibilitas_dusun is "tertentu"';

-- 2. Drop the existing form_tugas RLS policies to replace with corrected ones
DROP POLICY IF EXISTS "Users can view forms based on visibility rules" ON public.form_tugas;
DROP POLICY IF EXISTS "Admins can manage form_tugas" ON public.form_tugas;

-- Create the corrected RLS policy for SELECT on form_tugas
CREATE POLICY "Users can view forms based on visibility rules" ON public.form_tugas
FOR SELECT
USING (
  -- Admins can see everything
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- For 'semua' and 'semua_data', everyone can see the form
  visibilitas_dusun IN ('semua', 'semua_data')
  OR
  -- For 'tertentu', only users from selected dusuns can see the form
  (
    visibilitas_dusun = 'tertentu'
    AND (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(COALESCE(dusun_terpilih, '{}'))
  )
);

-- Create the corrected RLS policy for ALL operations on form_tugas
CREATE POLICY "Admins can manage form_tugas" ON public.form_tugas
FOR ALL
USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

-- Also need to update the RLS policies for form_tugas_data to properly handle visibility based on the 'Dusun' field
-- This ensures that the visibility logic is properly applied to the form data entries

-- First, drop existing form_tugas_data policies if they exist
DROP POLICY IF EXISTS "Select policy for form_tugas_data based on form visibility and dusun field" ON form_tugas_data;
DROP POLICY IF EXISTS "Insert policy for form_tugas_data based on form visibility and dusun field" ON form_tugas_data;
DROP POLICY IF EXISTS "Update policy for form_tugas_data based on form visibility and dusun field" ON form_tugas_data;
DROP POLICY IF EXISTS "Delete policy for form_tugas_data based on form visibility and dusun field" ON form_tugas_data;
DROP FUNCTION IF EXISTS get_dusun_from_form_data(jsonb);

-- Create a function to extract the dusun value from form data
CREATE OR REPLACE FUNCTION get_dusun_from_form_data(data jsonb)
RETURNS text AS $function$
DECLARE
    dusun_value text;
BEGIN
    -- Check various possible field names for the dusun
    dusun_value := data->>'Dusun';
    IF dusun_value IS NOT NULL AND trim(dusun_value) != '' THEN
        RETURN TRIM(dusun_value);
    END IF;
    
    dusun_value := data->>'dusun';
    IF dusun_value IS NOT NULL AND trim(dusun_value) != '' THEN
        RETURN TRIM(dusun_value);
    END IF;
    
    dusun_value := data->>'DUSUN';
    IF dusun_value IS NOT NULL AND trim(dusun_value) != '' THEN
        RETURN TRIM(dusun_value);
    END IF;
    
    dusun_value := data->>'Ds';
    IF dusun_value IS NOT NULL AND trim(dusun_value) != '' THEN
        RETURN TRIM(dusun_value);
    END IF;
    
    dusun_value := data->>'ds';
    IF dusun_value IS NOT NULL AND trim(dusun_value) != '' THEN
        RETURN TRIM(dusun_value);
    END IF;
    
    dusun_value := data->>'DUSUN_TERKAIT';
    IF dusun_value IS NOT NULL AND trim(dusun_value) != '' THEN
        RETURN TRIM(dusun_value);
    END IF;
    
    dusun_value := data->>'DUSUN_ASAL';
    IF dusun_value IS NOT NULL AND trim(dusun_value) != '' THEN
        RETURN TRIM(dusun_value);
    END IF;
    
    -- If no valid dusun field found, return NULL
    RETURN NULL;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create corrected RLS policy for form_tugas_data based on form visibility and 'Dusun' field in data_custom
CREATE POLICY "Select policy for form_tugas_data based on form visibility and dusun field"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  -- Admin can see all data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus can see data based on form visibility and data dusun field
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (
      -- If form is 'semua_data', kadus can see all data from that form
      (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua_data'
      OR
      -- If form is 'semua' or 'tertentu' and kadus has access to the form and data matches their dusun
      (
        (
          (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua'
          OR
          (
            (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'tertentu'
            AND (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(
              COALESCE((SELECT dusun_terpilih FROM form_tugas WHERE id = form_tugas_data.form_tugas_id), '{}')
            )
          )
        )
        -- The data must match the user's dusun based on the 'Dusun' field in data_custom
        AND (
          -- If data has 'Dusun' field, it must match user's dusun
          (get_dusun_from_form_data(form_tugas_data.data_custom) IS NOT NULL
           AND get_dusun_from_form_data(form_tugas_data.data_custom) = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
          -- If no 'Dusun' field in data, allow access (for backward compatibility)
          OR (get_dusun_from_form_data(form_tugas_data.data_custom) IS NULL)
        )
      )
    )
  )
);

-- 4. Create corrected RLS policy for insert
CREATE POLICY "Insert policy for form_tugas_data based on form visibility and dusun field"
ON form_tugas_data FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin can insert to all forms
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus can only insert based on form visibility and matching dusun
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (
      -- If form is 'semua_data', kadus can insert
      (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua_data'
      OR
      -- If form is 'semua' or 'tertentu' and kadus has access to the form
      (
        (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua'
        OR
        (
          (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'tertentu'
          AND (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(
            COALESCE((SELECT dusun_terpilih FROM form_tugas WHERE id = form_tugas_data.form_tugas_id), '{}')
          )
        )
      )
    )
    -- Data must match user's dusun if 'Dusun' field is present
    AND (
      -- If data has 'Dusun' field, it must match user's dusun
      (get_dusun_from_form_data(form_tugas_data.data_custom) IS NOT NULL
       AND get_dusun_from_form_data(form_tugas_data.data_custom) = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
      -- If no 'Dusun' field in data, allow insertion (for backward compatibility)
      OR (get_dusun_from_form_data(form_tugas_data.data_custom) IS NULL)
    )
  )
);

-- 5. Create corrected RLS policy for update
CREATE POLICY "Update policy for form_tugas_data based on form visibility and dusun field"
ON form_tugas_data FOR UPDATE
TO authenticated
USING ( -- Row-level access condition
  -- Admin can update all data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus can update data based on form visibility and matching dusun
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (
      -- If form is 'semua_data', kadus can update all data from that form
      (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua_data'
      OR
      -- If form is 'semua' or 'tertentu' and kadus has access to the form and data matches their dusun
      (
        (
          (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua'
          OR
          (
            (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'tertentu'
            AND (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(
              COALESCE((SELECT dusun_terpilih FROM form_tugas WHERE id = form_tugas_data.form_tugas_id), '{}')
            )
          )
        )
        -- The data must match the user's dusun based on the 'Dusun' field in data_custom
        AND (
          -- If data has 'Dusun' field, it must match user's dusun
          (get_dusun_from_form_data(form_tugas_data.data_custom) IS NOT NULL
           AND get_dusun_from_form_data(form_tugas_data.data_custom) = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
          -- If no 'Dusun' field in data, allow access (for backward compatibility)
          OR (get_dusun_from_form_data(form_tugas_data.data_custom) IS NULL)
        )
      )
    )
  )
)
WITH CHECK ( -- Data modification condition
  -- Admin can update all data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus can only update based on form visibility and matching dusun
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (
      -- If form is 'semua_data', kadus can update
      (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua_data'
      OR
      -- If form is 'semua' or 'tertentu' and kadus has access to the form
      (
        (
          (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua'
          OR
          (
            (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'tertentu'
            AND (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(
              COALESCE((SELECT dusun_terpilih FROM form_tugas WHERE id = form_tugas_data.form_tugas_id), '{}')
            )
          )
        )
      )
    )
    -- Data must match user's dusun if 'Dusun' field is present
    AND (
      -- If data has 'Dusun' field, it must match user's dusun
      (get_dusun_from_form_data(form_tugas_data.data_custom) IS NOT NULL
       AND get_dusun_from_form_data(form_tugas_data.data_custom) = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
      -- If no 'Dusun' field in data, allow update (for backward compatibility)
      OR (get_dusun_from_form_data(form_tugas_data.data_custom) IS NULL)
    )
  )
);

-- 6. Create corrected RLS policy for delete
CREATE POLICY "Delete policy for form_tugas_data based on form visibility and dusun field"
ON form_tugas_data FOR DELETE
TO authenticated
USING (
  -- Admin can delete all data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus can delete data based on form visibility and matching dusun
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (
      -- If form is 'semua_data', kadus can delete data from that form
      (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua_data'
      OR
      -- If form is 'semua' or 'tertentu' and kadus has access to the form and data matches their dusun
      (
        (
          (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua'
          OR
          (
            (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'tertentu'
            AND (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(
              COALESCE((SELECT dusun_terpilih FROM form_tugas WHERE id = form_tugas_data.form_tugas_id), '{}')
            )
          )
        )
        -- The data must match the user's dusun based on the 'Dusun' field in data_custom
        AND (
          -- If data has 'Dusun' field, it must match user's dusun
          (get_dusun_from_form_data(form_tugas_data.data_custom) IS NOT NULL
           AND get_dusun_from_form_data(form_tugas_data.data_custom) = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
          -- If no 'Dusun' field in data, allow access (for backward compatibility)
          OR (get_dusun_from_form_data(form_tugas_data.data_custom) IS NULL)
        )
      )
    )
  )
);

-- Ensure RLS is enabled on both tables
ALTER TABLE form_tugas ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_tugas_data ENABLE ROW LEVEL SECURITY;
