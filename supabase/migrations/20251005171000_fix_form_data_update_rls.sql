-- MIGRASI PERBAIKAN: Perbaikan RLS untuk UPDATE form_tugas_data dalam mode 'semua_data'

-- Hapus kebijakan lama yang mungkin menyebabkan masalah
DROP POLICY IF EXISTS "Allow users to update their own data or data from their dusun in accessible forms or all data forms" ON form_tugas_data;

-- Buat kebijakan UPDATE yang benar untuk mendukung mode 'semua_data'
CREATE POLICY "Allow users to update form data properly in all contexts"
ON form_tugas_data FOR UPDATE
TO authenticated
USING (
  -- Admin bisa edit semua
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- User bisa edit data yang mereka submit
  auth.uid() = user_id
  OR
  -- Kadus bisa edit dalam mode 'semua_data' untuk form yang sesuai
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (
      -- Dalam mode 'semua_data', kadus bisa edit data apapun di form tersebut
      EXISTS (
        SELECT 1 
        FROM form_tugas ft 
        WHERE ft.id = (SELECT form_tugas_id FROM form_tugas_data WHERE id = form_tugas_data.id)
        AND ft.visibilitas_dusun = 'semua_data'
      )
      OR
      -- Dalam mode normal, hanya edit data dari dusun mereka
      (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
      (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
    )
  )
)
WITH CHECK (
  -- Admin bisa simpan apapun
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- User bisa simpan data milik mereka
  auth.uid() = user_id  
  OR
  -- Kadus dalam mode 'semua_data' bisa simpan perubahan apapun
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    EXISTS (
      SELECT 1 
      FROM form_tugas ft 
      WHERE ft.id = (SELECT form_tugas_id FROM form_tugas_data WHERE id = form_tugas_data.id)
      AND ft.visibilitas_dusun = 'semua_data'
    )
  )
  OR
  -- Kadus dalam mode normal hanya bisa simpan ke penduduk dusun mereka
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
    (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Juga pastikan kebijakan SELECT mendukung tampilan data
-- (ini mungkin sudah ditangani dalam migrasi sebelumnya, tapi kita pastikan)
DROP POLICY IF EXISTS "Allow all authenticated to view their own data and data from their dusun in accessible forms or all data mode" ON form_tugas_data;
CREATE POLICY "Allow comprehensive data viewing for forms"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- User bisa lihat data milik mereka
  auth.uid() = user_id
  OR
  -- Kadus bisa lihat data dalam form dengan mode 'semua_data'
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND EXISTS (
      SELECT 1 
      FROM form_tugas ft 
      WHERE ft.id = form_tugas_data.form_tugas_id
      AND ft.visibilitas_dusun = 'semua_data'
    )
  )
  OR
  -- Kadus bisa lihat data dari dusun mereka dalam mode normal
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
    (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Pastikan INSERT juga benar
-- (kita pertahankan migrasi sebelumnya tapi konfirmasi kebijakannya)
-- Harusnya ini sudah benar dari migrasi sebelumnya