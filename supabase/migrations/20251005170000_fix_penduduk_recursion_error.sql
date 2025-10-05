-- MIGRASI PERBAIKAN KRITIS: Memperbaiki RLS penduduk yang menyebabkan infinite recursion

-- Hapus kebijakan yang menyebabkan masalah
DROP POLICY IF EXISTS "Allow penduduk access based on form_tugas_data access" ON public.penduduk;

-- Kita kembali ke kebijakan penduduk yang lebih sederhana dan aman
-- Tapi kita tetap modifikasi untuk memperhitungkan mode 'semua_data' dalam form

-- Kita buat versi aman dari kebijakan penduduk
CREATE POLICY "Safe penduduk access policy for form context"
ON public.penduduk FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus bisa lihat penduduk dari dusun mereka (akses dasar)
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND penduduk.dusun = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
  )
  -- Kita TIDAK menyertakan kondisi EXISTS yang kompleks untuk menghindari recursion
);

-- Untuk kasus form_tugas khusus dalam mode 'semua_data', solusinya adalah
-- menggunakan pendekatan RPC seperti yang telah kita buat sebelumnya
-- dan tidak mengandalkan RLS join otomatis

-- Jadi kita kembalikan RLS penduduk ke bentuk yang aman
-- dan implementasi akses selektif untuk form dilakukan di sisi aplikasi/endpoint