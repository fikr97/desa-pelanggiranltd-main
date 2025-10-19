-- MIGRASI POKOK: Menyesuaikan kebijakan RLS untuk form_tugas_data agar visibilitas bergantung pada field 'Dusun' dalam data_custom
-- Ini adalah migrasi utama yang menggantikan pendekatan sebelumnya

-- Hapus kebijakan lama
DROP POLICY IF EXISTS "Select policy for form_tugas_data based on form visibility and dusun field" ON form_tugas_data;
DROP POLICY IF EXISTS "Insert policy for form_tugas_data based on form visibility and dusun field" ON form_tugas_data;
DROP POLICY IF EXISTS "Update policy for form_tugas_data based on form visibility and dusun field" ON form_tugas_data;
DROP POLICY IF EXISTS "Delete policy for form_tugas_data based on form visibility and dusun field" ON form_tugas_data;
DROP FUNCTION IF EXISTS extract_dusun_from_data(jsonb);
DROP FUNCTION IF EXISTS get_form_data_dusun(uuid);

-- Buat fungsi untuk mengekstrak nilai dusun dari field 'Dusun' dalam data_custom
CREATE OR REPLACE FUNCTION get_dusun_from_form_data(data jsonb)
RETURNS text AS $$
DECLARE
    dusun_value text;
BEGIN
    -- Cek berbagai kemungkinan penamaan field dusun dalam data_custom
    -- Prioritas tertinggi: 'Dusun', kemudian variasi lainnya
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
    
    -- Jika tidak ditemukan field Dusun yang valid dalam data_custom, kembalikan NULL
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Kebijakan SELECT - berdasarkan visibilitas form dan field Dusun dalam data_custom
CREATE POLICY "Select policy for form_tugas_data based on form visibility and dusun field"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus hanya bisa lihat data dari form yang sesuai visibilitasnya dan dusun yang sesuai dengan field 'Dusun' dalam data_custom
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (
      -- Jika form dalam mode 'semua_data', kadus bisa lihat semua data dari form tsb
      (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua_data'
      OR
      -- Jika form dalam mode 'semua' atau 'tertentu' dan kadus berhak mengakses form dan data dari dusun yang sesuai
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
        -- Kadus hanya bisa lihat data yang memiliki field 'Dusun' dalam data_custom yang sesuai dengan dusun mereka
        AND (
          -- Jika data memiliki field 'Dusun' dalam data_custom, maka harus sama dengan dusun user
          (get_dusun_from_form_data(form_tugas_data.data_custom) IS NOT NULL
           AND get_dusun_from_form_data(form_tugas_data.data_custom) = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
          -- Jika data tidak memiliki field 'Dusun' dalam data_custom, maka bisa diakses (fallback untuk backward compatibility)
          OR (get_dusun_from_form_data(form_tugas_data.data_custom) IS NULL)
        )
      )
    )
  )
);

-- 2. Kebijakan INSERT - berdasarkan visibilitas form dan field Dusun dalam data_custom
CREATE POLICY "Insert policy for form_tugas_data based on form visibility and dusun field"
ON form_tugas_data FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin bisa insert ke semua form
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus hanya bisa insert ke form yang sesuai visibilitasnya dan untuk dusun yang sesuai
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (
      -- Jika form dalam mode 'semua_data', kadus bisa insert ke form tsb
      (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua_data'
      OR
      -- Jika form dalam mode 'semua' atau 'tertentu' dan kadus berhak mengakses form
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
    -- Kadus hanya bisa insert data yang memiliki field 'Dusun' dalam data_custom yang sesuai dengan dusun mereka
    AND (
      -- Jika data memiliki field 'Dusun' dalam data_custom, maka harus sama dengan dusun user
      (get_dusun_from_form_data(form_tugas_data.data_custom) IS NOT NULL
       AND get_dusun_from_form_data(form_tugas_data.data_custom) = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
      -- Jika data tidak memiliki field 'Dusun' dalam data_custom, maka bisa di-insert (fallback untuk backward compatibility)
      OR (get_dusun_from_form_data(form_tugas_data.data_custom) IS NULL)
    )
  )
);

-- 3. Kebijakan UPDATE - berdasarkan visibilitas form dan field Dusun dalam data_custom
CREATE POLICY "Update policy for form_tugas_data based on form visibility and dusun field"
ON form_tugas_data FOR UPDATE
TO authenticated
USING ( -- Akses ke baris
  -- Admin bisa update semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus hanya bisa update data dari form yang sesuai visibilitasnya dan dusun yang sesuai
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (
      -- Jika form dalam mode 'semua_data', kadus bisa update data dari form tsb
      (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua_data'
      OR
      -- Jika form dalam mode 'semua' atau 'tertentu' dan kadus berhak mengakses form dan data dari dusun yang sesuai
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
        -- Kadus hanya bisa update data yang memiliki field 'Dusun' dalam data_custom yang sesuai dengan dusun mereka
        AND (
          -- Jika data memiliki field 'Dusun' dalam data_custom, maka harus sama dengan dusun user
          (get_dusun_from_form_data(form_tugas_data.data_custom) IS NOT NULL
           AND get_dusun_from_form_data(form_tugas_data.data_custom) = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
          -- Jika data tidak memiliki field 'Dusun' dalam data_custom, maka bisa diakses (fallback untuk backward compatibility)
          OR (get_dusun_from_form_data(form_tugas_data.data_custom) IS NULL)
        )
      )
    )
  )
)
WITH CHECK ( -- Update data
  -- Admin bisa update semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus hanya bisa update data dari form yang sesuai visibilitasnya dan dusun yang sesuai
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (
      -- Jika form dalam mode 'semua_data', kadus bisa update data dari form tsb
      (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua_data'
      OR
      -- Jika form dalam mode 'semua' atau 'tertentu' dan kadus berhak mengakses form
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
      -- Kadus hanya bisa update data yang memiliki field 'Dusun' dalam data_custom yang sesuai dengan dusun mereka
      AND (
        -- Jika data memiliki field 'Dusun' dalam data_custom, maka harus sama dengan dusun user
        (get_dusun_from_form_data(form_tugas_data.data_custom) IS NOT NULL
         AND get_dusun_from_form_data(form_tugas_data.data_custom) = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
        -- Jika data tidak memiliki field 'Dusun' dalam data_custom, maka bisa di-update (fallback untuk backward compatibility)
        OR (get_dusun_from_form_data(form_tugas_data.data_custom) IS NULL)
      )
    )
  )
);

-- 4. Kebijakan DELETE - berdasarkan visibilitas form dan field Dusun dalam data_custom
CREATE POLICY "Delete policy for form_tugas_data based on form visibility and dusun field"
ON form_tugas_data FOR DELETE
TO authenticated
USING (
  -- Admin bisa delete semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus hanya bisa delete data dari form yang sesuai visibilitasnya dan dusun yang sesuai
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (
      -- Jika form dalam mode 'semua_data', kadus bisa delete data dari form tsb
      (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua_data'
      OR
      -- Jika form dalam mode 'semua' atau 'tertentu' dan kadus berhak mengakses form dan data dari dusun yang sesuai
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
        -- Kadus hanya bisa delete data yang memiliki field 'Dusun' dalam data_custom yang sesuai dengan dusun mereka
        AND (
          -- Jika data memiliki field 'Dusun' dalam data_custom, maka harus sama dengan dusun user
          (get_dusun_from_form_data(form_tugas_data.data_custom) IS NOT NULL
           AND get_dusun_from_form_data(form_tugas_data.data_custom) = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
          -- Jika data tidak memiliki field 'Dusun' dalam data_custom, maka bisa diakses (fallback untuk backward compatibility)
          OR (get_dusun_from_form_data(form_tugas_data.data_custom) IS NULL)
        )
      )
    )
  )
);

-- Konfirmasi bahwa RLS aktif
ALTER TABLE form_tugas_data ENABLE ROW LEVEL SECURITY;