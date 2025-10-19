-- MIGRASI PERBAIKAN: Memperbaiki kebijakan RLS untuk form_tugas_data agar visibilitas form berfungsi dengan benar berdasarkan dusun user
-- Visibilitas ditentukan oleh visibilitas_dusun pada form_tugas dan akses data berdasarkan kesesuaian dusun antara user dan data

-- Hapus kebijakan lama
DROP POLICY IF EXISTS "Select policy for form_tugas_data based on form visibility" ON form_tugas_data;
DROP POLICY IF EXISTS "Insert policy for form_tugas_data based on form visibility" ON form_tugas_data;
DROP POLICY IF EXISTS "Update policy for form_tugas_data based on form visibility" ON form_tugas_data;
DROP POLICY IF EXISTS "Delete policy for form_tugas_data based on form visibility" ON form_tugas_data;

-- 1. Kebijakan SELECT - berdasarkan visibilitas form
CREATE POLICY "Select policy for form_tugas_data based on form visibility"
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
        -- Kadus hanya bisa lihat data dari dusun mereka sendiri (untuk mode 'semua' dan 'tertentu')
        AND (
          -- Jika data terkait dengan penduduk, maka dusun penduduk harus sama dengan dusun user
          (form_tugas_data.penduduk_id IS NOT NULL AND 
           (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
           (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
          -- Jika data tidak terkait dengan penduduk (penduduk_id NULL), maka bisa diakses
          OR (form_tugas_data.penduduk_id IS NULL)
        )
      )
    )
  )
);

-- 2. Kebijakan INSERT - berdasarkan visibilitas form dan dusun
CREATE POLICY "Insert policy for form_tugas_data based on form visibility"
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
    -- Kadus hanya bisa insert data untuk dusun mereka sendiri
    AND (
      -- Jika penduduk_id disertakan, maka dusun penduduk harus sama dengan dusun user
      (form_tugas_data.penduduk_id IS NOT NULL AND
       (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
       (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
      -- Jika tidak ada penduduk_id, maka bisa di-insert
      OR (form_tugas_data.penduduk_id IS NULL)
    )
  )
);

-- 3. Kebijakan UPDATE - berdasarkan visibilitas form dan dusun
CREATE POLICY "Update policy for form_tugas_data based on form visibility"
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
        -- Kadus hanya bisa update data dari dusun mereka sendiri
        AND (
          -- Jika data terkait dengan penduduk, maka dusun penduduk harus sama dengan dusun user
          (form_tugas_data.penduduk_id IS NOT NULL AND 
           (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
           (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
          -- Jika data tidak terkait dengan penduduk (penduduk_id NULL), maka bisa diakses
          OR (form_tugas_data.penduduk_id IS NULL)
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
      -- Kadus hanya bisa update data untuk dusun mereka sendiri
      AND (
        -- Jika penduduk_id disertakan, maka dusun penduduk harus sama dengan dusun user
        (form_tugas_data.penduduk_id IS NOT NULL AND
         (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
         (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
        -- Jika tidak ada penduduk_id, maka bisa di-update
        OR (form_tugas_data.penduduk_id IS NULL)
      )
    )
  )
);

-- 4. Kebijakan DELETE - berdasarkan visibilitas form dan dusun
CREATE POLICY "Delete policy for form_tugas_data based on form visibility"
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
        -- Kadus hanya bisa delete data dari dusun mereka sendiri
        AND (
          -- Jika data terkait dengan penduduk, maka dusun penduduk harus sama dengan dusun user
          (form_tugas_data.penduduk_id IS NOT NULL AND 
           (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
           (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()))
          -- Jika data tidak terkait dengan penduduk (penduduk_id NULL), maka bisa diakses
          OR (form_tugas_data.penduduk_id IS NULL)
        )
      )
    )
  )
);

-- Konfirmasi bahwa RLS aktif
ALTER TABLE form_tugas_data ENABLE ROW LEVEL SECURITY;