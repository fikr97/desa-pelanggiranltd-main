-- MIGRASI TAMBAHAN: Perbaikan kebijakan RLS untuk form_tugas_data agar memungkinkan update data oleh kadus tanpa konflik

-- Hapus kebijakan lama yang mungkin menyebabkan konflik
DROP POLICY IF EXISTS "Final safe update policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Final safe select policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Final safe insert policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Final safe delete policy for form_tugas_data" ON form_tugas_data;

-- Buat ulang kebijakan SELECT untuk form_tugas_data
CREATE POLICY "Final safe select policy for form_tugas_data"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus bisa lihat semua data (kita gunakan pendekatan umum)
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
  OR
  -- User bisa lihat data milik mereka sendiri
  user_id = auth.uid()
);

-- Buat ulang kebijakan INSERT untuk form_tugas_data
CREATE POLICY "Final safe insert policy for form_tugas_data"
ON form_tugas_data FOR INSERT
TO authenticated
WITH CHECK (
  -- Hanya admin atau kadus yang bisa insert
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'kadus')
  AND
  -- Jika user adalah kadus, cek apakah form dalam mode 'semua_data'
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua_data'
    OR
    -- Atau penduduk dari dusun mereka sendiri
    (SELECT p.dusun FROM penduduk p WHERE p.id = form_tugas_data.penduduk_id) = 
    (SELECT pr.dusun FROM public.profiles pr WHERE pr.user_id = auth.uid())
  )
);

-- Buat ulang kebijakan UPDATE untuk form_tugas_data
CREATE POLICY "Final safe update policy for form_tugas_data"
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
  -- Kadus bisa update data dari dusun mereka
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (SELECT p.dusun FROM penduduk p WHERE p.id = form_tugas_data.penduduk_id) = 
    (SELECT pr.dusun FROM public.profiles pr WHERE pr.user_id = auth.uid())
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
    (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua_data'
  )
  OR
  -- Kadus bisa update data dari dusun mereka
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (SELECT p.dusun FROM penduduk p WHERE p.id = form_tugas_data.penduduk_id) = 
    (SELECT pr.dusun FROM public.profiles pr WHERE pr.user_id = auth.uid())
  )
);

-- Buat ulang kebijakan DELETE untuk form_tugas_data
CREATE POLICY "Final safe delete policy for form_tugas_data"
ON form_tugas_data FOR DELETE
TO authenticated
USING (
  -- Hanya admin yang bisa delete data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Pastikan RLS diaktifkan untuk form_tugas_data
ALTER TABLE form_tugas_data ENABLE ROW LEVEL SECURITY;