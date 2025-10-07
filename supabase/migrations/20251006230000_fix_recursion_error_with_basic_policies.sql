-- MIGRASI PERBAIKAN FINAL: Memperbaiki infinite recursion dengan pendekatan paling aman
-- Gunakan fungsi RPC untuk operasi kompleks dan RLS sederhana untuk operasi dasar

-- Hapus semua kebijakan lama
DROP POLICY IF EXISTS "Fixed insert policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed update policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed select policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed delete policy for form_tugas_data with all_data_mode" ON form_tugas_data;

-- Buat kebijakan RLS yang sangat sederhana untuk mencegah infinite recursion
-- Kebijakan ini hanya memeriksa role pengguna, bukan data penduduk atau form langsung

-- 1. Kebijakan SELECT sederhana
CREATE POLICY "Basic select policy for form_tugas_data"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
);

-- 2. Kebijakan INSERT sederhana
CREATE POLICY "Basic insert policy for form_tugas_data"
ON form_tugas_data FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'kadus')
);

-- 3. Kebijakan UPDATE sederhana
CREATE POLICY "Basic update policy for form_tugas_data"
ON form_tugas_data FOR UPDATE
TO authenticated
USING ( -- Kondisi akses ke baris
  (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
)
WITH CHECK ( -- Kondisi update
  (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'kadus')
);

-- 4. Kebijakan DELETE sederhana
CREATE POLICY "Basic delete policy for form_tugas_data"
ON form_tugas_data FOR DELETE
TO authenticated
USING (
  (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
);

-- Pastikan RLS diaktifkan
ALTER TABLE form_tugas_data ENABLE ROW LEVEL SECURITY;

-- Catatan penting:
-- Dengan pendekatan ini, semua kontrol akses dilakukan di level aplikasi
-- Melalui fungsi-fungsi RPC yang kita buat sebelumnya:
-- - get_form_data_with_penduduk()
-- - insert_form_data_for_all_dusun()
-- - update_form_data_for_all_dusun()
-- - update_form_data_with_penduduk_check()
-- 
-- Ini adalah pendekatan yang lebih aman untuk menghindari infinite recursion
-- karena logika kompleks dijalankan di luar konteks RLS.