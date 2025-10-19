-- MIGRASI TAMBAHAN: Fungsi untuk mengekstrak nilai dusun dari form_tugas_data dengan beberapa sumber prioritas
-- Prioritas: 1) Field Dusun dalam data_custom, 2) Dusun dari penduduk terkait, 3) NULL

-- Hapus fungsi jika sudah ada
DROP FUNCTION IF EXISTS get_form_data_dusun(uuid);

-- Buat fungsi untuk mengekstrak nilai dusun dari form_tugas_data dengan beberapa sumber
CREATE OR REPLACE FUNCTION get_form_data_dusun(form_data_id uuid)
RETURNS text AS $$
DECLARE
    dusun_value text;
    data_custom_value jsonb;
    penduduk_dusun_value text;
BEGIN
    -- Ambil data_custom dan penduduk_id dari form_tugas_data
    SELECT ftd.data_custom, p.dusun
    INTO data_custom_value, penduduk_dusun_value
    FROM form_tugas_data ftd
    LEFT JOIN penduduk p ON ftd.penduduk_id = p.id
    WHERE ftd.id = form_data_id;

    -- Cek berbagai kemungkinan penamaan field dusun dalam data_custom (prioritas 1)
    dusun_value := data_custom_value->>'Dusun';
    IF dusun_value IS NOT NULL AND trim(dusun_value) != '' THEN
        RETURN dusun_value;
    END IF;
    
    dusun_value := data_custom_value->>'dusun';
    IF dusun_value IS NOT NULL AND trim(dusun_value) != '' THEN
        RETURN dusun_value;
    END IF;
    
    dusun_value := data_custom_value->>'DUSUN';
    IF dusun_value IS NOT NULL AND trim(dusun_value) != '' THEN
        RETURN dusun_value;
    END IF;
    
    dusun_value := data_custom_value->>'Ds';
    IF dusun_value IS NOT NULL AND trim(dusun_value) != '' THEN
        RETURN dusun_value;
    END IF;
    
    dusun_value := data_custom_value->>'ds';
    IF dusun_value IS NOT NULL AND trim(dusun_value) != '' THEN
        RETURN dusun_value;
    END IF;
    
    dusun_value := data_custom_value->>'DUSUN_TERKAIT';
    IF dusun_value IS NOT NULL AND trim(dusun_value) != '' THEN
        RETURN dusun_value;
    END IF;
    
    dusun_value := data_custom_value->>'DUSUN_ASAL';
    IF dusun_value IS NOT NULL AND trim(dusun_value) != '' THEN
        RETURN dusun_value;
    END IF;

    -- Jika tidak ditemukan di data_custom, gunakan dusun dari penduduk terkait (prioritas 2)
    IF penduduk_dusun_value IS NOT NULL AND trim(penduduk_dusun_value) != '' THEN
        RETURN penduduk_dusun_value;
    END IF;

    -- Jika tidak ada sumber yang valid, kembalikan NULL
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Buat kebijakan RLS yang menggunakan fungsi ini
-- Hapus kebijakan sebelumnya dari migration sebelumnya
DROP POLICY IF EXISTS "Select policy for form_tugas_data based on form visibility and dusun field" ON form_tugas_data;
DROP POLICY IF EXISTS "Insert policy for form_tugas_data based on form visibility and dusun field" ON form_tugas_data;
DROP POLICY IF EXISTS "Update policy for form_tugas_data based on form visibility and dusun field" ON form_tugas_data;
DROP POLICY IF EXISTS "Delete policy for form_tugas_data based on form visibility and dusun field" ON form_tugas_data;

-- 1. Kebijakan SELECT - berdasarkan visibilitas form dan field Dusun dalam data_custom atau dari penduduk terkait
CREATE POLICY "Select policy for form_tugas_data based on form visibility and dusun field"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus hanya bisa lihat data dari form yang sesuai visibilitasnya dan dusun yang sesuai
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
        -- Kadus hanya bisa lihat data sesuai dengan dusun (dari data_custom atau penduduk terkait)
        AND (
          -- Jika data memiliki dusun (dari data_custom atau penduduk terkait), maka harus sesuai dengan dusun user
          (get_form_data_dusun(form_tugas_data.id) IS NOT NULL
            AND get_form_data_dusun(form_tugas_data.id) = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
          -- Jika data tidak memiliki dusun (dari data_custom atau penduduk terkait), maka bisa diakses (fallback)
          OR (get_form_data_dusun(form_tugas_data.id) IS NULL)
        )
      )
    )
  )
);

-- 2. Kebijakan INSERT - berdasarkan visibilitas form dan field Dusun dalam data_custom atau dari penduduk terkait
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
    -- Kadus hanya bisa insert data untuk dusun mereka sendiri berdasarkan dusun (dari data_custom atau penduduk terkait)
    AND (
      -- Jika data memiliki dusun (dari data_custom atau penduduk terkait), maka harus sesuai dengan dusun user
      (get_form_data_dusun(form_tugas_data.id) IS NOT NULL
        AND get_form_data_dusun(form_tugas_data.id) = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
      -- Jika data tidak memiliki dusun (dari data_custom atau penduduk terkait), maka bisa di-insert (fallback)
      OR (get_form_data_dusun(form_tugas_data.id) IS NULL)
    )
  )
);

-- 3. Kebijakan UPDATE - berdasarkan visibilitas form dan field Dusun dalam data_custom atau dari penduduk terkait
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
        -- Kadus hanya bisa update data sesuai dengan dusun (dari data_custom atau penduduk terkait)
        AND (
          -- Jika data memiliki dusun (dari data_custom atau penduduk terkait), maka harus sesuai dengan dusun user
          (get_form_data_dusun(form_tugas_data.id) IS NOT NULL
            AND get_form_data_dusun(form_tugas_data.id) = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
          -- Jika data tidak memiliki dusun (dari data_custom atau penduduk terkait), maka bisa diakses (fallback)
          OR (get_form_data_dusun(form_tugas_data.id) IS NULL)
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
      -- Kadus hanya bisa update data untuk dusun mereka sendiri berdasarkan dusun (dari data_custom atau penduduk terkait)
      AND (
        -- Jika data memiliki dusun (dari data_custom atau penduduk terkait), maka harus sesuai dengan dusun user
        (get_form_data_dusun(form_tugas_data.id) IS NOT NULL
          AND get_form_data_dusun(form_tugas_data.id) = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
        -- Jika data tidak memiliki dusun (dari data_custom atau penduduk terkait), maka bisa di-update (fallback)
        OR (get_form_data_dusun(form_tugas_data.id) IS NULL)
      )
    )
  )
);

-- 4. Kebijakan DELETE - berdasarkan visibilitas form dan field Dusun dalam data_custom atau dari penduduk terkait
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
        -- Kadus hanya bisa delete data sesuai dengan dusun (dari data_custom atau penduduk terkait)
        AND (
          -- Jika data memiliki dusun (dari data_custom atau penduduk terkait), maka harus sesuai dengan dusun user
          (get_form_data_dusun(form_tugas_data.id) IS NOT NULL
            AND get_form_data_dusun(form_tugas_data.id) = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
          -- Jika data tidak memiliki dusun (dari data_custom atau penduduk terkait), maka bisa diakses (fallback)
          OR (get_form_data_dusun(form_tugas_data.id) IS NULL)
        )
      )
    )
  )
);

-- Konfirmasi bahwa RLS aktif
ALTER TABLE form_tugas_data ENABLE ROW LEVEL SECURITY;