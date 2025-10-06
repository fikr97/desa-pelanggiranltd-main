-- MIGRASI PERBAIKAN: Memperbaiki kebijakan RLS DELETE untuk form_tugas_data
-- agar kadus bisa menghapus data dalam mode 'semua_data'

-- Hapus kebijakan delete lama
DROP POLICY IF EXISTS "Fixed delete policy for form_tugas_data" ON form_tugas_data;

-- Buat kebijakan DELETE baru yang mendukung mode 'semua_data'
CREATE POLICY "Fixed delete policy for form_tugas_data with all_data_mode"
ON form_tugas_data FOR DELETE
TO authenticated
USING (
  -- Admin bisa delete semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus bisa delete data dalam form mode 'semua_data'  
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (SELECT ft.visibilitas_dusun FROM form_tugas ft WHERE ft.id = form_tugas_data.form_tugas_id) = 'semua_data'
  )
  OR
  -- Kadus bisa delete data dari dusun mereka sendiri di mode non-semua_data
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (SELECT ft.visibilitas_dusun FROM form_tugas ft WHERE ft.id = form_tugas_data.form_tugas_id) != 'semua_data'
    AND
    (
      (form_tugas_data.penduduk_id IS NULL) -- Izinkan akses ke data tanpa penduduk terkait
      OR
      COALESCE((SELECT p.dusun FROM penduduk p WHERE p.id = form_tugas_data.penduduk_id), '') = 
      (SELECT pr.dusun FROM public.profiles pr WHERE pr.user_id = auth.uid())
    )
  )
);

-- Pastikan RLS diaktifkan untuk form_tugas_data
ALTER TABLE form_tugas_data ENABLE ROW LEVEL SECURITY;