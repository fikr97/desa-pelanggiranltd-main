-- MIGRASI PERBAIKAN: Memperbaiki kebijakan RLS SELECT untuk mode 'semua_data'
-- agar kadus bisa melihat semua data dari form, termasuk yang dibuat oleh admin

-- Hapus kebijakan lama
DROP POLICY IF EXISTS "Fixed select policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;

-- Buat kebijakan SELECT baru yang benar untuk mode 'semua_data'
CREATE POLICY "Corrected select policy for form_tugas_data in all_data_mode"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus dalam form mode 'semua_data' bisa lihat semua data dari form itu
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua_data'
  )
  OR
  -- Kadus bisa lihat data dari dusun mereka di form non-semua_data
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) != 'semua_data'
    AND
    (
      (form_tugas_data.penduduk_id IS NULL) -- Izinkan akses ke data tanpa penduduk terkait
      OR
      COALESCE((SELECT p.dusun FROM penduduk p WHERE p.id = form_tugas_data.penduduk_id), (SELECT pr.dusun FROM public.profiles pr WHERE pr.user_id = auth.uid())) = 
      (SELECT pr.dusun FROM public.profiles pr WHERE pr.user_id = auth.uid())
    )
  )
);