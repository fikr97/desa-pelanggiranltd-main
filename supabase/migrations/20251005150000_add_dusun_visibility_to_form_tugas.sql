-- MIGRASI: Tambahkan kolom visibilitas dusun ke tabel form_tugas
-- Tujuan: Memungkinkan admin mengatur apakah form_tugas ditampilkan ke semua dusun atau hanya ke dusun tertentu

-- 1. Tambahkan kolom baru ke tabel form_tugas
ALTER TABLE form_tugas 
ADD COLUMN IF NOT EXISTS visibilitas_dusun TEXT DEFAULT 'semua' CHECK (visibilitas_dusun IN ('semua', 'tertentu')),
ADD COLUMN IF NOT EXISTS dusun_terpilih TEXT[] DEFAULT '{}';

-- 2. Tambahkan komentar untuk dokumentasi kolom
COMMENT ON COLUMN form_tugas.visibilitas_dusun IS 'Menentukan visibilitas form: "semua" untuk semua dusun, "tertentu" untuk dusun yang dipilih';
COMMENT ON COLUMN form_tugas.dusun_terpilih IS 'Array nama-nama dusun yang dapat mengakses form jika visibilitas_dusun = "tertentu"';

-- 3. Perbarui RLS untuk membatasi akses form_tugas berdasarkan dusun pengguna
-- Hapus kebijakan lama jika ada
DROP POLICY IF EXISTS "Kadus can view form_tugas based on dusun visibility" ON form_tugas;
DROP POLICY IF EXISTS "Allow authenticated to view form_tugas" ON form_tugas;

-- Buat kebijakan baru untuk menggantikan yang lama
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
      (visibilitas_dusun = 'tertentu' AND (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(dusun_terpilih))
    )
  )
);

-- Jika ada kebijakan untuk akses CRUD lainnya, kita juga perlu memperbaruinya untuk admin saja
-- (karena hanya admin yang bisa membuat/mengedit form_tugas)
DROP POLICY IF EXISTS "Allow admin to manage form_tugas" ON form_tugas;
CREATE POLICY "Allow admin to manage form_tugas"
ON form_tugas FOR ALL TO authenticated
USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');