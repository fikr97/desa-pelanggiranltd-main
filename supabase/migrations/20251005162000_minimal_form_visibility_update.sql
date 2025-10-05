-- MIGRASI FINAL: Tambahkan Opsi Visibilitas "Semua Data" ke Sistem Form Tugas

-- Pastikan constraint kolom visibilitas_dusun mencakup semua opsi
ALTER TABLE form_tugas DROP CONSTRAINT IF EXISTS form_tugas_visibilitas_dusun_check;
ALTER TABLE form_tugas 
ADD CONSTRAINT form_tugas_visibilitas_dusun_check 
CHECK (visibilitas_dusun IN ('semua', 'tertentu', 'semua_data'));

-- Perbarui komentar kolom
COMMENT ON COLUMN form_tugas.visibilitas_dusun IS 'Menentukan visibilitas form: "semua" - form bisa dilihat semua dusun, "tertentu" - hanya dusun terpilih, "semua_data" - kadus bisa lihat semua data seperti admin';
COMMENT ON COLUMN form_tugas.dusun_terpilih IS 'Array nama-nama dusun yang dapat mengakses form jika visibilitas_dusun = "tertentu"';

-- Hapus dan buat ulang kebijakan SELECT untuk form_tugas
DROP POLICY IF EXISTS "Allow authenticated to view form_tugas based on visibility" ON form_tugas;
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
      -- Atau form dengan akses semua data
      visibilitas_dusun = 'semua_data'
    )
  )
);

-- Hapus dan buat ulang kebijakan SELECT untuk form_tugas_data
DROP POLICY IF EXISTS "Allow all authenticated to view their own data and data from their dusun in accessible forms or all data mode" ON form_tugas_data;
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

-- Pastikan dokumentasi terbaru
-- Untuk menerapkan perubahan ini, cukup jalankan migrasi ini setelah migrasi sebelumnya