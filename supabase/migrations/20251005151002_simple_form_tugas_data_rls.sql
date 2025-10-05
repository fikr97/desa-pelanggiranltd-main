-- MIGRASI PENGGANTI: RLS sederhana untuk form_tugas_data

-- Hapus semua kebijakan lama untuk form_tugas_data
DROP POLICY IF EXISTS "Users can manage their own submitted data" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to view their own form data" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow admin to view all form data" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow authenticated to insert form data" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to update their own form data" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow admin to delete form data" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to view form data based on form visibility and ownership" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to insert form data for residents in their dusun" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to update form data for residents in their dusun" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow admin to delete form data" ON form_tugas_data;

-- Kebijakan SELECT: Admin lihat semua, user lihat miliknya sendiri, kadus lihat berdasarkan form visibility dan penduduk
CREATE POLICY "Select policy for form_tugas_data"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- User bisa lihat data yang mereka submit
  auth.uid() = user_id
  OR
  -- Kadus bisa lihat data di form yang terbuka untuk dusun mereka DAN penduduk dari dusun mereka
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (
      (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua'
      OR
      (
        (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'tertentu'
        AND 
        (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(
          SELECT dusun_terpilih FROM form_tugas WHERE id = form_tugas_data.form_tugas_id
        )
      )
    )
    AND
    -- Penduduk yang terkait juga dari dusun yang sama dengan kadus
    (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
    (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Kebijakan INSERT: Hanya admin atau kadus untuk penduduk di dusun mereka
CREATE POLICY "Insert policy for form_tugas_data"
ON form_tugas_data FOR INSERT
TO authenticated
WITH CHECK (
  -- Harus admin atau kadus
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    (
      (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
      AND
      -- Hanya untuk penduduk di dusun mereka
      (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
      (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
      AND
      -- Dan form harus tersedia untuk dusun mereka
      (
        (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua'
        OR
        (
          (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'tertentu'
          AND 
          (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(
            SELECT dusun_terpilih FROM form_tugas WHERE id = form_tugas_data.form_tugas_id
          )
        )
      )
    )
  )
  AND
  -- Selalu tetapkan user_id sebagai pengguna yang submit data
  (form_tugas_data.user_id = auth.uid() OR form_tugas_data.user_id IS NULL)
);

-- Kebijakan UPDATE: Hanya admin atau user yang submit data, dan hanya untuk penduduk di dusun mereka
CREATE POLICY "Update policy for form_tugas_data"
ON form_tugas_data FOR UPDATE
TO authenticated
USING (
  -- Harus admin atau user yang submit data ini
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR auth.uid() = user_id
)
WITH CHECK (
  -- Jika bukan admin, hanya bisa update data penduduk dari dusun mereka
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR (
    (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
    (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Kebijakan DELETE: Hanya admin
CREATE POLICY "Delete policy for form_tugas_data"
ON form_tugas_data FOR DELETE
TO authenticated
USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');