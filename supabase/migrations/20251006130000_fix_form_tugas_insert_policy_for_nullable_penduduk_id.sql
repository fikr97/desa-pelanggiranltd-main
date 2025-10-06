-- MIGRASI PERBAIKAN: Memperbaiki kebijakan RLS INSERT untuk form_tugas_data 
-- agar memungkinkan menyimpan data meskipun penduduk_id NULL

-- Hapus kebijakan lama
DROP POLICY IF EXISTS "Fixed insert policy for form_tugas_data" ON form_tugas_data;

-- Buat kebijakan INSERT baru yang mendukung penduduk_id NULL
CREATE POLICY "Fixed insert policy for form_tugas_data with nullable penduduk_id"
ON form_tugas_data FOR INSERT
TO authenticated
WITH CHECK (
  -- Hanya admin atau kadus yang bisa insert
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'kadus')
  AND
  -- Jika user adalah admin atau form dalam mode 'semua_data', bypass cek dusun
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    (SELECT ft.visibilitas_dusun FROM form_tugas ft WHERE ft.id = form_tugas_data.form_tugas_id) = 'semua_data'
    OR
    -- Atau penduduk dari dusun user sendiri (termasuk ketika penduduk_id NULL)
    (form_tugas_data.penduduk_id IS NULL) -- Izinkan data tanpa penduduk terkait
    OR
    COALESCE((SELECT p.dusun FROM penduduk p WHERE p.id = form_tugas_data.penduduk_id), '') = 
    (SELECT pr.dusun FROM public.profiles pr WHERE pr.user_id = auth.uid())
  )
);

-- Hapus kebijakan update lama untuk konsistensi
DROP POLICY IF EXISTS "Fixed update policy for form_tugas_data" ON form_tugas_data;

-- Buat kebijakan UPDATE baru yang juga mendukung penduduk_id NULL
CREATE POLICY "Fixed update policy for form_tugas_data with nullable penduduk_id"
ON form_tugas_data FOR UPDATE
TO authenticated
USING ( -- USING clause menentukan siapa yang bisa mengakses baris untuk update
  -- Admin bisa update semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus dalam form mode 'semua_data' bisa update semua data
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua_data'
  )
  OR
  -- Kadus bisa update data dari dusun mereka (termasuk data tanpa penduduk_id)
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (
      (form_tugas_data.penduduk_id IS NULL) -- Izinkan update data tanpa penduduk terkait
      OR
      COALESCE((SELECT p.dusun FROM penduduk p WHERE p.id = form_tugas_data.penduduk_id), (SELECT pr.dusun FROM public.profiles pr WHERE pr.user_id = auth.uid())) = 
      (SELECT pr.dusun FROM public.profiles pr WHERE pr.user_id = auth.uid())
    )
  )
)
WITH CHECK ( -- WITH CHECK clause menentukan apakah update diperbolehkan
  -- Admin bisa update semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus dalam form mode 'semua_data' bisa update semua data
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (SELECT ft.visibilitas_dusun FROM form_tugas ft WHERE ft.id = form_tugas_data.form_tugas_id) = 'semua_data'
  )
  OR
  -- Kadus bisa update data dari dusun mereka (termasuk data tanpa penduduk_id)
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (
      (form_tugas_data.penduduk_id IS NULL) -- Izinkan update data tanpa penduduk terkait
      OR
      COALESCE((SELECT p.dusun FROM penduduk p WHERE p.id = form_tugas_data.penduduk_id), '') = 
      (SELECT pr.dusun FROM public.profiles pr WHERE pr.user_id = auth.uid())
    )
  )
);

-- Hapus kebijakan select lama untuk konsistensi
DROP POLICY IF EXISTS "Fixed select policy for form_tugas_data" ON form_tugas_data;

-- Buat kebijakan SELECT baru yang juga mendukung penduduk_id NULL
CREATE POLICY "Fixed select policy for form_tugas_data with nullable penduduk_id"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus dalam form mode 'semua_data' bisa lihat semua data
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua_data'
  )
  OR
  -- Kadus bisa lihat data dari dusun mereka (termasuk data tanpa penduduk_id)
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (
      (form_tugas_data.penduduk_id IS NULL) -- Izinkan akses ke data tanpa penduduk terkait
      OR
      COALESCE((SELECT p.dusun FROM penduduk p WHERE p.id = form_tugas_data.penduduk_id), (SELECT pr.dusun FROM public.profiles pr WHERE pr.user_id = auth.uid())) = 
      (SELECT pr.dusun FROM public.profiles pr WHERE pr.user_id = auth.uid())
    )
  )
);