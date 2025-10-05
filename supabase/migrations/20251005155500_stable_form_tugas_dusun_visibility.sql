-- MIGRASI FINAL: Sistem Form Tugas dengan Visibilitas Dusun (Versi Stabil)

-- Hapus semua kebijakan yang ada terlebih dahulu
DROP POLICY IF EXISTS "Allow authenticated to view form_tugas based on visibility" ON form_tugas;
DROP POLICY IF EXISTS "Allow admin to manage form_tugas" ON form_tugas;
DROP POLICY IF EXISTS "Allow all authenticated to view their own data and data from their dusun in accessible forms" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to insert data for residents in their dusun to accessible forms" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to update their own data or data from their dusun in accessible forms" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow admin to delete form data" ON form_tugas_data;

-- Pastikan kolom-kolom yang diperlukan ada
ALTER TABLE form_tugas 
ADD COLUMN IF NOT EXISTS visibilitas_dusun TEXT DEFAULT 'semua' CHECK (visibilitas_dusun IN ('semua', 'tertentu')),
ADD COLUMN IF NOT EXISTS dusun_terpilih TEXT[] DEFAULT '{}';

COMMENT ON COLUMN form_tugas.visibilitas_dusun IS 'Menentukan visibilitas form: "semua" untuk semua dusun, "tertentu" untuk dusun yang dipilih';
COMMENT ON COLUMN form_tugas.dusun_terpilih IS 'Array nama-nama dusun yang dapat mengakses form jika visibilitas_dusun = "tertentu"';

-- Kebijakan untuk form_tugas (SELECT berdasarkan visibilitas, CRUD hanya untuk admin)
CREATE POLICY "Allow authenticated to view form_tugas based on visibility"
ON form_tugas FOR SELECT TO authenticated
USING (
  -- Admin selalu bisa melihat semua form
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus bisa melihat form jika:
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (
      -- Form tersedia untuk semua dusun
      visibilitas_dusun = 'semua'
      OR
      -- Atau form hanya untuk dusun tertentu dan dusun user ada di daftar
      (visibilitas_dusun = 'tertentu' AND (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(COALESCE(dusun_terpilih, '{}')))
    )
  )
);

CREATE POLICY "Allow admin to manage form_tugas"
ON form_tugas FOR ALL TO authenticated
USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

-- Kebijakan untuk form_tugas_data
CREATE POLICY "Allow all authenticated to view their own data and data from their dusun in accessible forms"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- User bisa lihat data yang mereka submit
  auth.uid() = user_id
  OR
  -- Kadus bisa lihat data JIKA:
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    -- 1. Form yang diakses sesuai visibilitas
    (
      (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua'
      OR
      (
        (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'tertentu'
        AND 
        (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(
          COALESCE((SELECT dusun_terpilih FROM form_tugas WHERE id = form_tugas_data.form_tugas_id), '{}')
        )
      )
    )
    AND
    -- 2. Data terkait dengan penduduk di dusun mereka
    (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
    (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Allow users to insert data for residents in their dusun to accessible forms"
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
            COALESCE((SELECT dusun_terpilih FROM form_tugas WHERE id = form_tugas_data.form_tugas_id), '{}')
          )
        )
      )
    )
  )
  AND
  -- Selalu tetapkan user_id sebagai pengguna yang submit data
  (form_tugas_data.user_id = auth.uid() OR form_tugas_data.user_id IS NULL)
);

CREATE POLICY "Allow users to update their own data or data from their dusun in accessible forms"
ON form_tugas_data FOR UPDATE
TO authenticated
USING (
  -- Harus admin atau user yang submit data ini
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR auth.uid() = user_id
)
WITH CHECK (
  -- Harus admin atau hanya update data penduduk dari dusun mereka
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR (
    (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
    (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Allow admin to delete form data"
ON form_tugas_data FOR DELETE
TO authenticated
USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

-- Konfirmasi bahwa semua kebijakan telah diterapkan
-- SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename IN ('form_tugas', 'form_tugas_data');