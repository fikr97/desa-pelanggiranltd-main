-- MIGRASI PEMBERSIHAN: Membersihkan semua kebijakan dan fungsi lama sebelum menerapkan kebijakan aman

-- Hapus semua kebijakan RLS yang mungkin masih ada
DROP POLICY IF EXISTS "Fixed insert policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed update policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed select policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed delete policy for form_tugas_data with all_data_mode" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe select policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe insert policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe update policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe delete policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe select policy for form_tugas_data v2" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe insert policy for form_tugas_data v2" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe update policy for form_tugas_data v2" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe delete policy for form_tugas_data v2" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe select policy for form_tugas_data final" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe insert policy for form_tugas_data final" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe update policy for form_tugas_data final" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe delete policy for form_tugas_data final" ON form_tugas_data;

-- Hapus fungsi helper yang menyebabkan dependency
-- Kita gunakan CASCADE untuk memaksa penghapusan
DROP FUNCTION IF EXISTS check_form_data_access(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_user_role_safe() CASCADE;
DROP FUNCTION IF EXISTS get_user_dusun_safe() CASCADE;

-- Sekarang terapkan kebijakan RLS sederhana yang aman
-- 1. Kebijakan SELECT: Sederhana
CREATE POLICY "Safe select policy for form_tugas_data final"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus bisa lihat data (validasi lebih detail dilakukan di fungsi RPC)
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
);

-- 2. Kebijakan INSERT: Sederhana
CREATE POLICY "Safe insert policy for form_tugas_data final"
ON form_tugas_data FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin dan kadus bisa insert data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'kadus')
);

-- 3. Kebijakan UPDATE: Sederhana
CREATE POLICY "Safe update policy for form_tugas_data final"
ON form_tugas_data FOR UPDATE
TO authenticated
USING ( -- Akses ke baris
  -- Admin dan kadus bisa update data (validasi lebih detail di fungsi RPC)
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'kadus')
)
WITH CHECK ( -- Update data
  -- Admin dan kadus bisa update data (validasi lebih detail di fungsi RPC)
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'kadus')
);

-- 4. Kebijakan DELETE: Memungkinkan kadus menghapus
CREATE POLICY "Safe delete policy for form_tugas_data final"
ON form_tugas_data FOR DELETE
TO authenticated
USING (
  -- Admin bisa delete semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus bisa delete data (validasi sebenarnya akan dilakukan di fungsi RPC)
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
);

-- Pastikan RLS diaktifkan
ALTER TABLE form_tugas_data ENABLE ROW LEVEL SECURITY;

-- Konfirmasi bahwa kebijakan telah diterapkan
-- Anda bisa menghapus komentar ini setelah pengujian
-- SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'form_tugas_data';