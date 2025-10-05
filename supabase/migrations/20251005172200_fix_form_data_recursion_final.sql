-- MIGRASI PERBAIKAN KRITIS: Memperbaiki RLS form_tugas_data yang menyebabkan infinite recursion (Versi Akhir yang Aman)

-- Hapus kebijakan lama dan fungsi yang menyebabkan recursion
DROP POLICY IF EXISTS "Safe select policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe insert policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe update policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe delete policy for form_tugas_data" ON form_tugas_data;
DROP FUNCTION IF EXISTS can_select_form_data(UUID);
DROP FUNCTION IF EXISTS can_insert_form_data(UUID, UUID);
DROP FUNCTION IF EXISTS can_update_form_data(UUID, UUID, UUID);

-- Pendekatan yang PALING AMAN: Kebijakan RLS sederhana tanpa subquery kompleks

-- Kebijakan SELECT: Sangat sederhana
CREATE POLICY "Final safe select policy for form_tugas_data"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- User bisa lihat data yang mereka submit
  auth.uid() = user_id
  OR
  -- Kadus bisa lihat semua data (kita gunakan pendekatan umum)
  -- Untuk mode 'semua_data' dan mode normal, kita gunakan pendekatan berbeda di frontend
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
);

-- Kebijakan INSERT: Sederhana
CREATE POLICY "Final safe insert policy for form_tugas_data"
ON form_tugas_data FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin bisa insert apapun
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- User bisa insert data untuk diri sendiri
  auth.uid() = user_id
  OR
  -- Kadus bisa insert (validasi lebih detail di frontend dan fungsi RPC)
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
);

-- Kebijakan UPDATE: Sederhana
CREATE POLICY "Final safe update policy for form_tugas_data"
ON form_tugas_data FOR UPDATE
TO authenticated
USING (
  -- Admin bisa update semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- User bisa update data yang mereka submit
  auth.uid() = user_id
  OR
  -- Kadus bisa update semua data (validasi lebih detail di frontend dan fungsi RPC)
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
)
WITH CHECK (
  -- Admin bisa update apapun
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- User bisa update data mereka
  auth.uid() = user_id
  OR
  -- Kadus bisa update semua data (validasi lebih detail di frontend dan fungsi RPC)
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
);

-- Kebijakan DELETE: Hanya admin
CREATE POLICY "Final safe delete policy for form_tugas_data"
ON form_tugas_data FOR DELETE
TO authenticated
USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

-- Pastikan RLS diaktifkan untuk form_tugas_data
ALTER TABLE form_tugas_data ENABLE ROW LEVEL SECURITY;

-- Konfirmasi bahwa kebijakan telah diterapkan
-- SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'form_tugas_data';