-- MIGRASI PERBAIKAN: Perbaikan kebijakan RLS untuk form_tugas_data agar kadus bisa menyimpan data untuk semua dusun dalam mode 'semua_data'

-- Hapus kebijakan lama
DROP POLICY IF EXISTS "Final safe insert policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Final safe update policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Final safe select policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Final safe delete policy for form_tugas_data" ON form_tugas_data;

-- Buat ulang kebijakan SELECT untuk form_tugas_data
CREATE POLICY "Fixed select policy for form_tugas_data"
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
  -- Kadus bisa lihat data dari dusun mereka
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    COALESCE((SELECT p.dusun FROM penduduk p WHERE p.id = form_tugas_data.penduduk_id), (SELECT pr.dusun FROM public.profiles pr WHERE pr.user_id = auth.uid())) = 
    (SELECT pr.dusun FROM public.profiles pr WHERE pr.user_id = auth.uid())
  )
);

-- Buat ulang kebijakan INSERT untuk form_tugas_data - Khusus untuk mengatasi masalah 'semua_data'
CREATE POLICY "Fixed insert policy for form_tugas_data"
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
    -- Atau penduduk dari dusun user sendiri
    COALESCE((SELECT p.dusun FROM penduduk p WHERE p.id = form_tugas_data.penduduk_id), '') = 
    (SELECT pr.dusun FROM public.profiles pr WHERE pr.user_id = auth.uid())
  )
);

-- Buat ulang kebijakan UPDATE untuk form_tugas_data
CREATE POLICY "Fixed update policy for form_tugas_data"
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
    COALESCE((SELECT p.dusun FROM penduduk p WHERE p.id = form_tugas_data.penduduk_id), (SELECT pr.dusun FROM public.profiles pr WHERE pr.user_id = auth.uid())) = 
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
    (SELECT ft.visibilitas_dusun FROM form_tugas ft WHERE ft.id = form_tugas_data.form_tugas_id) = 'semua_data'
  )
  OR
  -- Kadus bisa update data dari dusun mereka
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    COALESCE((SELECT p.dusun FROM penduduk p WHERE p.id = form_tugas_data.penduduk_id), '') = 
    (SELECT pr.dusun FROM public.profiles pr WHERE pr.user_id = auth.uid())
  )
);

-- Buat ulang kebijakan DELETE untuk form_tugas_data
CREATE POLICY "Fixed delete policy for form_tugas_data"
ON form_tugas_data FOR DELETE
TO authenticated
USING (
  -- Hanya admin yang bisa delete data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Pastikan RLS diaktifkan untuk form_tugas_data
ALTER TABLE form_tugas_data ENABLE ROW LEVEL SECURITY;

-- Aktifkan RLS untuk tabel pendukung jika belum
ALTER TABLE form_tugas ENABLE ROW LEVEL SECURITY;
ALTER TABLE penduduk ENABLE ROW LEVEL SECURITY;