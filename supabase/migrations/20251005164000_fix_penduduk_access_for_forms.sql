-- MIGRASI PERBAIKAN: Memungkinkan akses ke data penduduk dalam konteks form_tugas

-- Hapus kebijakan lama untuk penduduk
DROP POLICY IF EXISTS "Kadus can view their dusun penduduk" ON public.penduduk;

-- Buat kebijakan baru yang memungkinkan akses ke data penduduk dalam konteks form_tugas
-- Ini akan memungkinkan form untuk mengambil data penduduk ketika:
-- 1. User adalah admin, ATAU
-- 2. User adalah kadus dan form_tugas_data terkait dalam mode 'semua_data', ATAU
-- 3. User adalah kadus dan penduduk dari dusun mereka
CREATE POLICY "Allow access to penduduk based on form context"
ON public.penduduk FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua penduduk
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus bisa lihat penduduk dalam form_tugas_data dengan mode 'semua_data'
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND EXISTS (
      -- Cek apakah permintaan datang dalam konteks form_tugas_data dengan mode 'semua_data'
      SELECT 1 FROM form_tugas_data ftd
      JOIN form_tugas ft ON ftd.form_tugas_id = ft.id
      WHERE ftd.penduduk_id = penduduk.id
      AND ft.visibilitas_dusun = 'semua_data'
    )
  )
  OR
  -- Kadus bisa lihat penduduk dari dusun mereka sendiri
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND penduduk.dusun = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- Jika kebijakan di atas terlalu kompleks untuk RLS biasa, kita bisa gunakan pendekatan lain
-- dengan membuat fungsi bantu yang lebih kompleks untuk pendekatan kasus spesifik ini.
-- Tapi untuk saat ini, kita gunakan pendekatan yang lebih umum dan terbatas.

-- Alternatif: Buat kebijakan yang memungkinkan akses ke data penduduk dalam konteks form_tugas_data
-- Tapi ini akan mempengaruhi query lain, jadi kita perlu hati-hati.

-- Maka kita buat kebijakan yang lebih sederhana: 
-- Jika user sedang mengakses form_tugas_data, maka mereka bisa melihat penduduk terkait
-- Tapi karena RLS tidak bisa dengan mudah mendeteksi konteks panggilan, 
-- kita harus menggunakan pendekatan fungsi.

-- Jadi, mari kita buat fungsi bantu dan gunakan dalam kebijakan RLS penduduk
CREATE OR REPLACE FUNCTION can_access_penduduk(penduduk_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_dusun TEXT;
  penduduk_dusun TEXT;
  form_access_mode TEXT;
BEGIN
  -- Dapatkan role dan dusun pengguna
  SELECT role, dusun INTO user_role, user_dusun
  FROM public.profiles
  WHERE user_id = auth.uid();

  -- Dapatkan dusun penduduk
  SELECT dusun INTO penduduk_dusun
  FROM public.penduduk
  WHERE id = penduduk_id_param;

  -- Cek apakah penduduk ini terkait dengan form_tugas_data dengan mode 'semua_data'
  SELECT ft.visibilitas_dusun INTO form_access_mode
  FROM form_tugas_data ftd
  JOIN form_tugas ft ON ftd.form_tugas_id = ft.id
  WHERE ftd.penduduk_id = penduduk_id_param
  AND ftd.user_id = auth.uid(); -- Hanya periksa form yang dibuat oleh user ini

  -- Jika admin, selalu true
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Jika dalam form dengan mode 'semua_data', izinkan
  IF form_access_mode = 'semua_data' THEN
    RETURN TRUE;
  END IF;

  -- Jika dusun sama (untuk akses normal), izinkan
  IF user_dusun = penduduk_dusun THEN
    RETURN TRUE;
  END IF;

  -- Default: tidak izin
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Berikan hak eksekusi ke authenticated users
GRANT EXECUTE ON FUNCTION can_access_penduduk TO authenticated;

-- Buat kebijakan baru menggunakan fungsi bantu
CREATE POLICY "Allow access to penduduk based on context"
ON public.penduduk FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua penduduk
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus bisa lihat penduduk jika fungsi mengizinkan
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND can_access_penduduk(id)
  )
);