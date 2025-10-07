-- MIGRASI PERBAIKAN KRITIS: Memperbaiki infinite recursion pada RLS form_tugas_data
-- dengan pendekatan sederhana tanpa subquery kompleks

-- Hapus semua kebijakan lama
DROP POLICY IF EXISTS "Fixed insert policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed update policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed select policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed delete policy for form_tugas_data with all_data_mode" ON form_tugas_data;

-- Buat kebijakan RLS yang lebih sederhana dan aman
-- 1. Kebijakan SELECT
CREATE POLICY "Simple select policy for form_tugas_data"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua data
  (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus dalam form mode 'semua_data' bisa lihat semua data
  (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    form_tugas_id IN (
      SELECT id FROM form_tugas WHERE visibilitas_dusun = 'semua_data'
    )
  )
  OR
  -- Kadus bisa lihat data dari dusun mereka (dengan penduduk terkait)
  (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    form_tugas_id NOT IN (
      SELECT id FROM form_tugas WHERE visibilitas_dusun = 'semua_data'
    )
    AND 
    (
      penduduk_id IS NULL
      OR
      EXISTS (
        SELECT 1 FROM penduduk p, profiles pr
        WHERE p.id = form_tugas_data.penduduk_id
        AND pr.user_id = auth.uid()
        AND p.dusun = pr.dusun
      )
    )
  )
);

-- 2. Kebijakan INSERT - sederhana karena tidak perlu mengakses record yang sedang diinsert
CREATE POLICY "Simple insert policy for form_tugas_data"
ON form_tugas_data FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'kadus')
);

-- 3. Kebijakan UPDATE - hindari akses ke data penduduk di WITH CHECK
CREATE POLICY "Simple update policy for form_tugas_data"
ON form_tugas_data FOR UPDATE
TO authenticated
USING ( -- Kondisi untuk mengakses baris
  -- Admin bisa update semua data
  (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus dalam form mode 'semua_data' bisa update semua data
  (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    form_tugas_id IN (
      SELECT id FROM form_tugas WHERE visibilitas_dusun = 'semua_data'
    )
  )
  OR
  -- Kadus bisa update data dari dusun mereka
  (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    form_tugas_id NOT IN (
      SELECT id FROM form_tugas WHERE visibilitas_dusun = 'semua_data'
    )
    AND
    (
      penduduk_id IS NULL
      OR
      EXISTS (
        SELECT 1 FROM penduduk p, profiles pr
        WHERE p.id = form_tugas_data.penduduk_id
        AND pr.user_id = auth.uid()
        AND p.dusun = pr.dusun
      )
    )
  )
)
WITH CHECK ( -- Kondisi untuk data yang akan diupdate
  -- Hanya cek role, bukan data penduduk karena bisa menyebabkan recursion
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'kadus')
);

-- 4. Kebijakan DELETE
CREATE POLICY "Simple delete policy for form_tugas_data"
ON form_tugas_data FOR DELETE
TO authenticated
USING (
  -- Admin bisa delete semua data
  (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus dalam form mode 'semua_data' bisa delete semua data
  (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    form_tugas_id IN (
      SELECT id FROM form_tugas WHERE visibilitas_dusun = 'semua_data'
    )
  )
  OR
  -- Kadus bisa delete data dari dusun mereka
  (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    form_tugas_id NOT IN (
      SELECT id FROM form_tugas WHERE visibilitas_dusun = 'semua_data'
    )
    AND
    (
      penduduk_id IS NULL
      OR
      EXISTS (
        SELECT 1 FROM penduduk p, profiles pr
        WHERE p.id = form_tugas_data.penduduk_id
        AND pr.user_id = auth.uid()
        AND p.dusun = pr.dusun
      )
    )
  )
);

-- Pastikan RLS diaktifkan
ALTER TABLE form_tugas_data ENABLE ROW LEVEL SECURITY;