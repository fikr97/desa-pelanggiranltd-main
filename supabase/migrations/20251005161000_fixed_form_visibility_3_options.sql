-- MIGRASI PERBAIKAN: Perbarui sistem visibilitas form dengan 3 opsi - Versi Tanpa Error Duplikasi

-- Hapus semua kebijakan yang relevan terlebih dahulu
DROP POLICY IF EXISTS "Allow authenticated to view form_tugas based on visibility" ON form_tugas;
DROP POLICY IF EXISTS "Allow admin to manage form_tugas" ON form_tugas;
DROP POLICY IF EXISTS "Allow all authenticated to view their own data and data from their dusun in accessible forms or all data mode" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to insert data for residents in their dusun to accessible forms" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to update their own data or data from their dusun in accessible forms" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow admin to delete form data" ON form_tugas_data;

-- Perbarui definisi cek kolom visibilitas_dusun untuk menyertakan opsi baru
ALTER TABLE form_tugas DROP CONSTRAINT IF EXISTS form_tugas_visibilitas_dusun_check;
ALTER TABLE form_tugas 
ADD CONSTRAINT form_tugas_visibilitas_dusun_check 
CHECK (visibilitas_dusun IN ('semua', 'tertentu', 'semua_data'));

-- Tambahkan komentar yang diperbarui
COMMENT ON COLUMN form_tugas.visibilitas_dusun IS 'Menentukan visibilitas form: "semua" - form bisa dilihat semua dusun, "tertentu" - hanya dusun terpilih, "semua_data" - kadus bisa lihat semua data seperti admin';
COMMENT ON COLUMN form_tugas.dusun_terpilih IS 'Array nama-nama dusun yang dapat mengakses form jika visibilitas_dusun = "tertentu"';

-- Kebijakan untuk form_tugas (diperbarui untuk mendukung 3 opsi)
CREATE POLICY "Allow authenticated to view form_tugas based on visibility"
ON form_tugas FOR SELECT TO authenticated
USING (
  -- Admin selalu bisa melihat semua form
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus bisa melihat form jika:
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (
      -- Form tersedia untuk semua dusun
      visibilitas_dusun = 'semua'
      OR
      -- Atau form hanya untuk dusun tertentu dan dusun user ada di daftar
      (visibilitas_dusun = 'tertentu' AND (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(COALESCE(dusun_terpilih, '{}')))
      OR
      -- Atau form dengan akses semua data (hanya berlaku untuk melihat data, bukan form itu sendiri)
      visibilitas_dusun = 'semua_data'
    )
  )
);

-- Kebijakan untuk form_tugas_data (diperbarui untuk mendukung mode "semua_data")
CREATE POLICY "Allow all authenticated to view their own data and data from their dusun in accessible forms or all data mode"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- User bisa lihat data yang mereka submit
  auth.uid() = user_id
  OR
  -- Kadus bisa lihat data dalam mode tertentu
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND
    (
      -- Mode "semua_data" - kadus bisa lihat semua data dalam form ini
      (
        (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua_data'
      )
      OR
      -- Mode normal - harus sesuai visibilitas dan dusun
      (
        (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) IN ('semua', 'tertentu')
        AND
        (
          (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua'
          OR
          (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'tertentu'
          AND 
          (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(
            COALESCE((SELECT dusun_terpilih FROM form_tugas WHERE id = form_tugas_data.form_tugas_id), '{}')
          )
        )
        AND
        -- Data harus dari dusun mereka (kecuali dalam mode "semua_data")
        (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
        (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
      )
    )
  )
);

-- Kebijakan INSERT tetap sama - tidak perlu mengakses semua data untuk insert
CREATE POLICY "Allow users to insert data for residents in their dusun to accessible forms"
ON form_tugas_data FOR INSERT
TO authenticated
WITH CHECK (
  -- Harus admin atau kadus
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    (
      (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
      AND
      -- Hanya untuk penduduk di dusun mereka
      (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
      (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
      AND
      -- Dan form harus tersedia untuk dusun mereka (kecuali dalam mode "semua_data")
      (
        (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua'
        OR
        (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'semua_data'
        OR
        (
          (SELECT visibilitas_dusun FROM form_tugas WHERE id = form_tugas_data.form_tugas_id) = 'tertentu'
          AND 
          (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(
            COALESCE((SELECT dusun_terpilih FROM form_tugas WHERE id = form_tugas_data.form_tugas_id), '{}')
          )
        )
      )
    )
  )
  AND
  -- Selalu tetapkan user_id sebagai pengguna yang submit data
  (form_tugas_data.user_id = auth.uid() OR form_tugas_data.user_id IS NULL)
);

-- Kebijakan UPDATE tetap membatasi akses hanya ke data dari dusun mereka sendiri
CREATE POLICY "Allow users to update their own data or data from their dusun in accessible forms"
ON form_tugas_data FOR UPDATE
TO authenticated
USING (
  -- Harus admin atau user yang submit data ini
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR auth.uid() = user_id
)
WITH CHECK (
  -- Harus admin atau hanya update data penduduk dari dusun mereka
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR (
    (SELECT dusun FROM penduduk WHERE id = form_tugas_data.penduduk_id) = 
    (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Kebijakan untuk manajemen form (tetap hanya untuk admin)
CREATE POLICY "Allow admin to manage form_tugas"
ON form_tugas FOR ALL TO authenticated
USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Allow admin to delete form data"
ON form_tugas_data FOR DELETE
TO authenticated
USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');