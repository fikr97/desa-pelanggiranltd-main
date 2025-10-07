-- MIGRASI PERBAIKAN FINAL AMAN: Memperbaiki infinite recursion dengan fungsi helper aman
-- dan tetap menjaga kontrol akses sesuai kebutuhan

-- Hapus semua kebijakan lama
DROP POLICY IF EXISTS "Fixed insert policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed update policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed select policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed delete policy for form_tugas_data with all_data_mode" ON form_tugas_data;

-- Buat fungsi helper sederhana untuk mengecek role pengguna (aman untuk RLS)
-- Fungsi ini tidak mengakses tabel lain yang memiliki RLS
CREATE OR REPLACE FUNCTION get_user_role_safe()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER -- Penting untuk mengakses auth.uid() dalam RLS
STABLE -- STABLE karena mengakses auth.uid()
AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_user_dusun_safe()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT dusun FROM profiles WHERE user_id = auth.uid();
$$;

-- Beri akses ke service_role agar bisa dipakai dalam RLS
GRANT EXECUTE ON FUNCTION get_user_role_safe TO service_role;
GRANT EXECUTE ON FUNCTION get_user_dusun_safe TO service_role;

-- Sekarang buat kebijakan RLS yang lebih aman dan kompleks tapi tidak menyebabkan rekursi
-- Kita akan mengakses data form dan penduduk di dalam WITH CHECK/USING dengan pendekatan aman

-- 1. Kebijakan SELECT
CREATE POLICY "Safe select policy for form_tugas_data v2"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  -- Admin selalu bisa
  get_user_role_safe() = 'admin'
  OR
  -- Kadus di mode semua_data bisa lihat semua data dari form itu
  (
    get_user_role_safe() = 'kadus'
    AND EXISTS (
      SELECT 1 FROM form_tugas ft 
      WHERE ft.id = form_tugas_data.form_tugas_id 
      AND ft.visibilitas_dusun = 'semua_data'
    )
  )
  OR
  -- Kadus di mode biasa hanya bisa lihat data dari dusun mereka
  (
    get_user_role_safe() = 'kadus'
    AND NOT EXISTS (
      SELECT 1 FROM form_tugas ft 
      WHERE ft.id = form_tugas_data.form_tugas_id 
      AND ft.visibilitas_dusun = 'semua_data'
    )
    AND (
      -- Data tanpa penduduk terkait
      form_tugas_data.penduduk_id IS NULL
      OR
      -- Data dengan penduduk dari dusun yang sama
      EXISTS (
        SELECT 1 FROM penduduk p 
        WHERE p.id = form_tugas_data.penduduk_id 
        AND p.dusun = get_user_dusun_safe()
      )
    )
  )
);

-- 2. Kebijakan INSERT (sederhana karena tidak perlu memeriksa baris tertentu)
CREATE POLICY "Safe insert policy for form_tugas_data v2"
ON form_tugas_data FOR INSERT
TO authenticated
WITH CHECK (
  get_user_role_safe() IN ('admin', 'kadus')
);

-- 3. Kebijakan UPDATE
CREATE POLICY "Safe update policy for form_tugas_data v2"
ON form_tugas_data FOR UPDATE
TO authenticated
USING ( -- Kondisi untuk mengakses baris
  -- Admin selalu bisa
  get_user_role_safe() = 'admin'
  OR
  -- Kadus di mode semua_data bisa update semua data dari form itu
  (
    get_user_role_safe() = 'kadus'
    AND EXISTS (
      SELECT 1 FROM form_tugas ft 
      WHERE ft.id = form_tugas_data.form_tugas_id 
      AND ft.visibilitas_dusun = 'semua_data'
    )
  )
  OR
  -- Kadus di mode biasa hanya bisa update data dari dusun mereka
  (
    get_user_role_safe() = 'kadus'
    AND NOT EXISTS (
      SELECT 1 FROM form_tugas ft 
      WHERE ft.id = form_tugas_data.form_tugas_id 
      AND ft.visibilitas_dusun = 'semua_data'
    )
    AND (
      -- Data tanpa penduduk terkait
      form_tugas_data.penduduk_id IS NULL
      OR
      -- Data dengan penduduk dari dusun yang sama
      EXISTS (
        SELECT 1 FROM penduduk p 
        WHERE p.id = form_tugas_data.penduduk_id 
        AND p.dusun = get_user_dusun_safe()
      )
    )
  )
)
WITH CHECK ( -- Kondisi untuk update yang dilakukan
  get_user_role_safe() IN ('admin', 'kadus')
);

-- 4. Kebijakan DELETE
CREATE POLICY "Safe delete policy for form_tugas_data v2"
ON form_tugas_data FOR DELETE
TO authenticated
USING (
  -- Admin selalu bisa
  get_user_role_safe() = 'admin'
  OR
  -- Kadus di mode semua_data bisa delete semua data dari form itu
  (
    get_user_role_safe() = 'kadus'
    AND EXISTS (
      SELECT 1 FROM form_tugas ft 
      WHERE ft.id = form_tugas_data.form_tugas_id 
      AND ft.visibilitas_dusun = 'semua_data'
    )
  )
  OR
  -- Kadus di mode biasa hanya bisa delete data dari dusun mereka
  (
    get_user_role_safe() = 'kadus'
    AND NOT EXISTS (
      SELECT 1 FROM form_tugas ft 
      WHERE ft.id = form_tugas_data.form_tugas_id 
      AND ft.visibilitas_dusun = 'semua_data'
    )
    AND (
      -- Data tanpa penduduk terkait
      form_tugas_data.penduduk_id IS NULL
      OR
      -- Data dengan penduduk dari dusun yang sama
      EXISTS (
        SELECT 1 FROM penduduk p 
        WHERE p.id = form_tugas_data.penduduk_id 
        AND p.dusun = get_user_dusun_safe()
      )
    )
  )
);

-- Pastikan RLS diaktifkan
ALTER TABLE form_tugas_data ENABLE ROW LEVEL SECURITY;

-- Catatan: Jika fungsi helper masih menyebabkan masalah recursion, 
-- kita harus kembali ke aplikasi frontend untuk mengganti semua 
-- query langsung ke tabel dengan fungsi RPC, atau gunakan pendekatan
-- dengan kebijakan RLS yang paling sederhana.