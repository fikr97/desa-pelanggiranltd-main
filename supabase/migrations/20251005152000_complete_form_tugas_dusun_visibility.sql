-- MIGRASI LENGKAP: Sistem Form Tugas dengan Visibilitas Dusun

-- LANGKAH 1: Tambahkan kolom visibilitas ke tabel form_tugas
ALTER TABLE form_tugas 
ADD COLUMN IF NOT EXISTS visibilitas_dusun TEXT DEFAULT 'semua' CHECK (visibilitas_dusun IN ('semua', 'tertentu')),
ADD COLUMN IF NOT EXISTS dusun_terpilih TEXT[] DEFAULT '{}';

-- Tambahkan komentar dokumentasi
COMMENT ON COLUMN form_tugas.visibilitas_dusun IS 'Menentukan visibilitas form: "semua" untuk semua dusun, "tertentu" untuk dusun yang dipilih';
COMMENT ON COLUMN form_tugas.dusun_terpilih IS 'Array nama-nama dusun yang dapat mengakses form jika visibilitas_dusun = "tertentu"';

-- LANGKAH 2: Perbarui RLS untuk form_tugas (hanya untuk SELECT sesuai visibilitas)
DROP POLICY IF EXISTS "Allow authenticated to view form_tugas based on visibility" ON form_tugas;
DROP POLICY IF EXISTS "Allow admin to manage form_tugas" ON form_tugas;

-- Kebijakan untuk akses form (SELECT)
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
      (visibilitas_dusun = 'tertentu' AND (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(dusun_terpilih))
    )
  )
);

-- Kebijakan untuk manajemen form (INSERT, UPDATE, DELETE) - hanya admin
CREATE POLICY "Allow admin to manage form_tugas"
ON form_tugas FOR ALL TO authenticated
USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

-- LANGKAH 3: Perbarui RLS untuk form_tugas_data agar sesuai dengan visibilitas form
DROP POLICY IF EXISTS "Select policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Insert policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Update policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Delete policy for form_tugas_data" ON form_tugas_data;

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

-- LANGKAH 4: Konfirmasi bahwa semua kebijakan telah diterapkan
-- Anda bisa mengecek kebijakan dengan menjalankan:
-- SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename IN ('form_tugas', 'form_tugas_data');