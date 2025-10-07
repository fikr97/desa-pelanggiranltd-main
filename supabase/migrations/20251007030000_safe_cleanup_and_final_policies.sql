-- MIGRASI PEMBERSIHAN AMAN: Membersihkan semua kebijakan RLS sebelum menerapkan kebijakan aman

-- Langkah 1: Hapus semua kebijakan RLS untuk form_tugas_data
DROP POLICY IF EXISTS "Fixed insert policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed update policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed select policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed delete policy for form_tugas_data with all_data_mode" ON form_tugas_data;

-- Hapus kebijakan yang lebih baru
DROP POLICY IF EXISTS "Safe select policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe insert policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe update policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe delete policy for form_tugas_data" ON form_tugas_data;

-- Hapus kebijakan versi 2
DROP POLICY IF EXISTS "Safe select policy for form_tugas_data v2" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe insert policy for form_tugas_data v2" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe update policy for form_tugas_data v2" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe delete policy for form_tugas_data v2" ON form_tugas_data;

-- Hapus kebijakan final
DROP POLICY IF EXISTS "Safe select policy for form_tugas_data final" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe insert policy for form_tugas_data final" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe update policy for form_tugas_data final" ON form_tugas_data;
DROP POLICY IF EXISTS "Safe delete policy for form_tugas_data final" ON form_tugas_data;

-- Langkah 2: Nonaktifkan RLS sementara untuk pembersihan yang aman
ALTER TABLE form_tugas_data DISABLE ROW LEVEL SECURITY;

-- Langkah 3: Hapus semua fungsi yang mungkin terkait
-- (Kita harus mengidentifikasi dan menghapus dependensi terlebih dahulu)
-- Dalam kasus ini, kita langsung terapkan kebijakan tanpa fungsi helper

-- Langkah 4: Aktifkan kembali RLS
ALTER TABLE form_tugas_data ENABLE ROW LEVEL SECURITY;

-- Langkah 5: Terapkan kebijakan RLS sederhana yang aman
-- 1. Kebijakan SELECT
CREATE POLICY "Safe select policy for form_tugas_data final"
ON form_tugas_data FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus bisa lihat data (validasi lebih detail dilakukan di fungsi RPC)
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
);

-- 2. Kebijakan INSERT
CREATE POLICY "Safe insert policy for form_tugas_data final"
ON form_tugas_data FOR INSERT
TO authenticated
WITH CHECK (
  -- Admin dan kadus bisa insert data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'kadus')
);

-- 3. Kebijakan UPDATE
CREATE POLICY "Safe update policy for form_tugas_data final"
ON form_tugas_data FOR UPDATE
TO authenticated
USING ( -- Akses ke baris
  -- Admin dan kadus bisa update data (validasi lebih detail di fungsi RPC)
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'kadus')
)
WITH CHECK ( -- Update data
  -- Admin dan kadus bisa update data (validasi lebih detail di fungsi RPC)
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) IN ('admin', 'kadus')
);

-- 4. Kebijakan DELETE
CREATE POLICY "Safe delete policy for form_tugas_data final"
ON form_tugas_data FOR DELETE
TO authenticated
USING (
  -- Admin bisa delete semua data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus bisa delete data
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
);

-- Konfirmasi bahwa RLS aktif
ALTER TABLE form_tugas_data ENABLE ROW LEVEL SECURITY;