-- MIGRASI PERBAIKAN KRITIS: Memperbaiki RLS form_tugas_data yang menyebabkan infinite recursion

-- Hapus kebijakan yang menyebabkan recursion
DROP POLICY IF EXISTS "Allow all authenticated to view their own data and data from their dusun in accessible forms or all data mode" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to insert data for residents in their dusun to accessible forms or all data forms" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to update their own data or data from their dusun in accessible forms or all data forms" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to update form data properly in all contexts" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow comprehensive data viewing for forms" ON form_tugas_data;

-- Buat kebijakan yang lebih sederhana dan aman untuk form_tugas_data

-- Kebijakan SELECT: Lebih sederhana untuk menghindari recursion
CREATE POLICY "Simple select policy for form_tugas_data"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- User bisa lihat data yang mereka submit
  auth.uid() = user_id
  OR
  -- Kadus bisa lihat data dalam form dengan mode 'semua_data'
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND EXISTS (
      SELECT 1 
      FROM form_tugas ft 
      WHERE ft.id = form_tugas_data.form_tugas_id
      AND ft.visibilitas_dusun = 'semua_data'
    )
  )
  OR
  -- Kadus bisa lihat data dari dusun mereka dalam mode normal
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND EXISTS (
      SELECT 1
      FROM penduduk p
      WHERE p.id = form_tugas_data.penduduk_id
      AND p.dusun = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
    )
    AND EXISTS (
      SELECT 1
      FROM form_tugas ft
      WHERE ft.id = form_tugas_data.form_tugas_id
      AND ft.visibilitas_dusun IN ('semua', 'tertentu')
    )
  )
);

-- Kebijakan INSERT: Sederhana dan aman
CREATE POLICY "Simple insert policy for form_tugas_data"
ON form_tugas_data FOR INSERT
TO authenticated
WITH CHECK (
  -- Harus admin atau user yang submit
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
    OR auth.uid() = user_id
  )
  AND
  -- Untuk kadus, pastikan penduduk dari dusun mereka
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    (
      (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
      AND EXISTS (
        SELECT 1
        FROM penduduk p
        WHERE p.id = form_tugas_data.penduduk_id
        AND p.dusun = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
      )
      AND EXISTS (
        SELECT 1
        FROM form_tugas ft
        WHERE ft.id = form_tugas_data.form_tugas_id
        AND (
          ft.visibilitas_dusun = 'semua'
          OR
          (ft.visibilitas_dusun = 'semua_data')
          OR
          (
            ft.visibilitas_dusun = 'tertentu'
            AND (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(COALESCE(ft.dusun_terpilih, '{}'))
          )
        )
      )
    )
  )
);

-- Kebijakan UPDATE: Sederhana dan aman
CREATE POLICY "Simple update policy for form_tugas_data"
ON form_tugas_data FOR UPDATE
TO authenticated
USING (
  -- Admin bisa update semua
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- User bisa update data yang mereka submit
  auth.uid() = user_id
  OR
  -- Kadus dalam mode 'semua_data' bisa update semua data
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND EXISTS (
      SELECT 1 
      FROM form_tugas ft 
      WHERE ft.id = form_tugas_data.form_tugas_id
      AND ft.visibilitas_dusun = 'semua_data'
    )
  )
  OR
  -- Kadus bisa update data penduduk dari dusun mereka
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND EXISTS (
      SELECT 1
      FROM penduduk p
      WHERE p.id = form_tugas_data.penduduk_id
      AND p.dusun = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
    )
  )
)
WITH CHECK (
  -- Admin bisa update apapun
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- User bisa update data mereka
  auth.uid() = user_id
  OR
  -- Kadus dalam mode 'semua_data' bisa update apapun
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND EXISTS (
      SELECT 1 
      FROM form_tugas ft 
      WHERE ft.id = form_tugas_data.form_tugas_id
      AND ft.visibilitas_dusun = 'semua_data'
    )
  )
  OR
  -- Kadus bisa update data penduduk dari dusun mereka
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND EXISTS (
      SELECT 1
      FROM penduduk p
      WHERE p.id = form_tugas_data.penduduk_id
      AND p.dusun = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
    )
  )
);

-- Kebijakan DELETE: Hanya admin
CREATE POLICY "Simple delete policy for form_tugas_data"
ON form_tugas_data FOR DELETE
TO authenticated
USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

-- Konfirmasi bahwa kebijakan telah diterapkan
-- SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'form_tugas_data';