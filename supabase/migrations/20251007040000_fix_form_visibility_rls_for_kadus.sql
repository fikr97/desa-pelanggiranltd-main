-- MIGRASI PERBAIKAN: Perbaikan RLS untuk memastikan visibilitas form berfungsi dengan benar untuk role kadus

-- Hapus kebijakan lama yang terlalu permisif
DROP POLICY IF EXISTS "Safe select policy for form_tugas_data final" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe insert policy for form_tugas_data final" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe update policy for form_tugas_data final" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe delete policy for form_tugas_data final" ON form_tugas_data;

-- 1. Kebijakan SELECT - berdasarkan visibilitas form
CREATE POLICY "Select policy for form_tugas_data based on form visibility"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus hanya bisa lihat data dari form yang sesuai visibilitasnya
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (
      -- Jika form dalam mode 'semua_data', kadus bisa lihat semua data dari form tsb
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
        -- Jika form_tugas_data tidak terkait dengan penduduk (penduduk_id NULL), maka bisa diakses
        AND (
          form_tugas_data.penduduk_id IS NULL
          OR
          -- Kalau ada penduduk_id, maka dusun harus sama dengan kadus
          (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
          (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
        )
      )
    )
  )
);

-- 2. Kebijakan INSERT - berdasarkan visibilitas form
CREATE POLICY "Insert policy for form_tugas_data based on form visibility"
ON form_tugas_data FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin bisa insert ke semua form
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus hanya bisa insert ke form yang sesuai visibilitasnya
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
      -- Jika form_tugas_data tidak terkait dengan penduduk (penduduk_id NULL), maka bisa diakses
      AND (
        form_tugas_data.penduduk_id IS NULL
        OR
        -- Kalau ada penduduk_id, maka dusun harus sama dengan kadus
        (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
        (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
      )
    )
  )
);

-- 3. Kebijakan UPDATE - berdasarkan visibilitas form
CREATE POLICY "Update policy for form_tugas_data based on form visibility"
ON form_tugas_data FOR UPDATE
TO authenticated
USING ( -- Akses ke baris
  -- Admin bisa update semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus hanya bisa update data dari form yang sesuai visibilitasnya
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
        -- Jika form_tugas_data tidak terkait dengan penduduk (penduduk_id NULL), maka bisa diakses
        AND (
          form_tugas_data.penduduk_id IS NULL
          OR
          -- Kalau ada penduduk_id, maka dusun harus sama dengan kadus
          (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
          (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
        )
      )
    )
  )
)
WITH CHECK ( -- Update data
  -- Admin bisa update semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus hanya bisa update data dari form yang sesuai visibilitasnya
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
        -- Jika form_tugas_data tidak terkait dengan penduduk (penduduk_id NULL), maka bisa diakses
        AND (
          form_tugas_data.penduduk_id IS NULL
          OR
          -- Kalau ada penduduk_id, maka dusun harus sama dengan kadus
          (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
          (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
        )
      )
    )
  )
);

-- 4. Kebijakan DELETE - berdasarkan visibilitas form
CREATE POLICY "Delete policy for form_tugas_data based on form visibility"
ON form_tugas_data FOR DELETE
TO authenticated
USING (
  -- Admin bisa delete semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus hanya bisa delete data dari form yang sesuai visibilitasnya
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (
      -- Jika form dalam mode 'semua_data', kadus bisa delete data dari form tsb
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
        -- Jika form_tugas_data tidak terkait dengan penduduk (penduduk_id NULL), maka bisa diakses
        AND (
          form_tugas_data.penduduk_id IS NULL
          OR
          -- Kalau ada penduduk_id, maka dusun harus sama dengan kadus
          (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
          (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
        )
      )
    )
  )
);

-- Konfirmasi bahwa RLS aktif
ALTER TABLE form_tugas_data ENABLE ROW LEVEL SECURITY;