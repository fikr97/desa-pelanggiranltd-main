-- MIGRASI PERBAIKAN: RLS Penduduk untuk Konteks Form Tugas

-- Kita kembali ke inti permasalahan:
-- Saat user mengakses form_tugas_data, mereka juga mengakses data penduduk terkait
-- melalui join (dengan sintaks select('*, penduduk(*)')). RLS penduduk yang ketat
-- membatasi akses ini.

-- Kita buat kebijakan penduduk yang lebih cerdas, yang memperhitungkan
-- apakah akses terjadi dalam konteks form_tugas_data dalam mode 'semua_data'

-- Kita buat kebijakan penduduk yang mengizinkan akses jika 
-- pengguna berhak mengakses form_tugas_data yang terkait dengan penduduk ini

-- Tapi karena RLS tidak bisa dengan mudah mendeteksi join kontekstual seperti ini,
-- kita gunakan pendekatan berikut:

-- Kita akan membuat kebijakan yang memeriksa apakah user saat ini bisa mengakses
-- form_tugas_data tertentu yang merujuk ke penduduk ini, dan jika form_tugas tersebut
-- dalam mode 'semua_data', maka akses ke penduduk tersebut diizinkan.

-- Tapi ini cukup kompleks untuk RLS standar.

-- Sebagai alternatif, kita buat kebijakan yang agak lebih permisif untuk form context:
-- Kita asumsikan bahwa ketika user bisa mengakses form dalam mode 'semua_data',
-- mereka mungkin akan perlu mengakses data penduduk terkait.

-- Kita buat kebijakan yang lebih tepat:

-- Hapus kebijakan penduduk sebelumnya
DROP POLICY IF EXISTS "Allow penduduk access in form context" ON public.penduduk;

-- Buat kebijakan penduduk yang memungkinkan akses jika user bisa mengakses form_tugas_data terkait
-- dalam konteks form_tugas dengan mode 'semua_data'
CREATE POLICY "Allow penduduk access based on form_tugas_data access"
ON public.penduduk FOR SELECT
TO authenticated
USING (
  -- Admin bisa akses semua
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus bisa akses penduduk dari dusun mereka (untuk operasi normal)
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND penduduk.dusun = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
  )
  OR
  -- Kadus bisa akses penduduk jika penduduk ini terkait dengan form_tugas_data 
  -- dalam form_tugas dengan mode 'semua_data' YANG BISA DIAKSES OLEH USER
  EXISTS (
    SELECT 1 
    FROM form_tugas_data ftd
    JOIN form_tugas ft ON ftd.form_tugas_id = ft.id
    WHERE ftd.penduduk_id = penduduk.id
    AND (
      -- Form dalam mode 'semua_data' dan user adalah kadus (kita asumsikan bisa akses karena jika tidak bisa, query form_tugas_data gagal dulu)
      (ft.visibilitas_dusun = 'semua_data' AND (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus')
      OR
      -- Atau form bisa diakses oleh user karena sesuai dusun atau peraturan lain 
      -- (ini kompleks, jadi kita gunakan pendekatan sederhana)
      (
        ft.visibilitas_dusun IN ('semua', 'tertentu')
        AND (
          ft.visibilitas_dusun = 'semua'
          OR
          (ft.visibilitas_dusun = 'tertentu' AND (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(COALESCE(ft.dusun_terpilih, '{}')))
        )
      )
    )
  )
);

-- Ini akan memungkinkan akses ke data penduduk ketika:
-- 1. User adalah admin
-- 2. Penduduk dari dusun yang sama dengan user (akses normal)
-- 3. Penduduk terkait dengan form_tugas_data dalam form dengan mode 'semua_data' (akses form spesifik)

-- Jika kebijakan ini masih terlalu ketat, kita bisa buat versi yang lebih permisif
-- untuk kasus form_tugas_data tertentu