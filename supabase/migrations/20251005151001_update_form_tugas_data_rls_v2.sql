-- MIGRASI PENGIKUT: Perbarui RLS untuk form_tugas_data agar kadus bisa melihat data yang mereka submit

-- Cek apakah kolom user_id sudah ada, jika tidak maka kita gunakan submitted_by
-- Berdasarkan file migrasi sebelumnya, kolom user_id ditambahkan

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
  -- Pengguna bisa melihat data milik mereka sendiri (menggunakan user_id)
  auth.uid() = user_id
  OR
  -- Kadus bisa melihat data jika form yang relevan terbuka untuk dusun mereka
  -- TAPI hanya jika data penduduknya berada di dusun mereka
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
    AND
    -- Tambahkan pengecekan bahwa penduduk yang terkait juga dari dusun yang sama
    (
      SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id
    ) = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Kebijakan untuk INSERT (menambahkan data) - hanya untuk penduduk di dusun yang sama
CREATE POLICY "Allow users to insert form data for residents in their dusun"
ON form_tugas_data FOR INSERT TO authenticated
WITH CHECK (
  -- Pastikan form bisa diakses berdasarkan visibilitas
  (
    (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua'
    OR
    (
      (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'tertentu'
      AND 
      (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(
        SELECT dusun_terpilih FROM form_tugas WHERE id = form_tugas_data.form_tugas_id
      )
    )
  )
  AND
  -- Hanya bisa submit data untuk penduduk di dusun mereka sendiri
  (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
  (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
  AND
  -- Tetapkan user_id agar bisa dikenali nanti
  form_tugas_data.user_id = auth.uid()
);

-- Kebijakan untuk UPDATE (mengedit data) - hanya data penduduk dari dusun mereka
CREATE POLICY "Allow users to update form data for residents in their dusun"
ON form_tugas_data FOR UPDATE TO authenticated
USING (
  -- Harus admin ATAU user yang submit data ini
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR auth.uid() = user_id  -- Hanya bisa edit data yang mereka submit
)
WITH CHECK (
  -- Harus admin ATAU hanya bisa update data penduduk dari dusun mereka
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR (
    (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
    (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Kebijakan untuk DELETE (menghapus data)
CREATE POLICY "Allow admin to delete form data"
ON form_tugas_data FOR DELETE TO authenticated
USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');