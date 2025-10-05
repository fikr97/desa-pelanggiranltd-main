-- MIGRASI PENGIKUT: Perbarui RLS untuk form_tugas_data agar kadus bisa melihat data yang mereka submit

-- Hapus kebijakan lama untuk form_tugas_data
DROP POLICY IF EXISTS "Users can manage their own submitted data" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to view their own form data" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow admin to view all form data" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow authenticated to insert form data" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to update their own form data" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow admin to delete form data" ON form_tugas_data;

-- Kebijakan baru untuk SELECT (membaca data)
CREATE POLICY "Allow users to view form data based on form visibility and ownership"
ON form_tugas_data FOR SELECT TO authenticated
USING (
  -- Admin bisa melihat semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus bisa melihat data milik mereka sendiri
  auth.uid() = submitted_by
  OR
  -- Kadus bisa melihat data jika form yang relevan terbuka untuk dusun mereka
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (
      -- Form tersedia untuk semua dusun
      (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua'
      OR
      -- Atau form hanya untuk dusun tertentu dan dusun user ada di daftar
      (
        (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'tertentu'
        AND 
        (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(
          SELECT dusun_terpilih FROM form_tugas WHERE id = form_tugas_data.form_tugas_id
        )
      )
    )
  )
);

-- Kebijakan untuk INSERT (menambahkan data)
CREATE POLICY "Allow authenticated users to insert form data"
ON form_tugas_data FOR INSERT TO authenticated
WITH CHECK (
  -- Semua pengguna terotentikasi bisa submit data ke form mereka akses
  -- Tetapi form harus bisa diakses oleh pengguna tergantung visibilitas
  (
    -- Form tersedia untuk semua dusun
    (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua'
    OR
    -- Atau form hanya untuk dusun tertentu dan dusun user ada di daftar
    (
      (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'tertentu'
      AND 
      (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(
        SELECT dusun_terpilih FROM form_tugas WHERE id = form_tugas_data.form_tugas_id
      )
    )
  )
);

-- Kebijakan untuk UPDATE (mengedit data) - hanya untuk data mereka sendiri
CREATE POLICY "Allow users to update their own form data"
ON form_tugas_data FOR UPDATE TO authenticated
USING (auth.uid() = submitted_by)  -- Hanya bisa edit data yang mereka submit
WITH CHECK (auth.uid() = submitted_by);  -- Hanya bisa simpan sebagai data mereka

-- Kebijakan untuk DELETE (menghapus data)
CREATE POLICY "Allow admin to delete form data"
ON form_tugas_data FOR DELETE TO authenticated
USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');