-- MIGRASI PERBAIKAN KRITIS: Memperbaiki RLS form_tugas_data yang menyebabkan infinite recursion (Versi Sangat Aman)

-- Hapus kebijakan lama yang menyebabkan recursion
DROP POLICY IF EXISTS "Simple select policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Simple insert policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Simple update policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Simple delete policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow all authenticated to view their own data and data from their dusun in accessible forms or all data mode" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to insert data for residents in their dusun to accessible forms or all data forms" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to update their own data or data from their dusun in accessible forms or all data forms" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to update form data properly in all contexts" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow comprehensive data viewing for forms" ON form_tugas_data;

-- Pendekatan yang sangat aman: Pisahkan logika kompleks ke fungsi untuk menghindari recursion

-- Buat fungsi bantu untuk mengecek akses SELECT
CREATE OR REPLACE FUNCTION can_select_form_data(p_form_data_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_dusun TEXT;
  form_visibility TEXT;
  penduduk_dusun TEXT;
BEGIN
  -- Dapatkan informasi user
  SELECT role, dusun INTO user_role, user_dusun
  FROM public.profiles
  WHERE user_id = auth.uid();

  -- Jika admin, selalu bisa
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Jika user submit data ini, bisa lihat
  IF EXISTS (
    SELECT 1 FROM form_tugas_data 
    WHERE id = p_form_data_id AND user_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;

  -- Dapatkan informasi form dan penduduk
  SELECT ft.visibilitas_dusun INTO form_visibility
  FROM form_tugas_data ftd
  JOIN form_tugas ft ON ftd.form_tugas_id = ft.id
  WHERE ftd.id = p_form_data_id;

  SELECT p.dusun INTO penduduk_dusun
  FROM form_tugas_data ftd
  JOIN penduduk p ON ftd.penduduk_id = p.id
  WHERE ftd.id = p_form_data_id;

  -- Mode 'semua_data' untuk kadus
  IF user_role = 'kadus' AND form_visibility = 'semua_data' THEN
    RETURN TRUE;
  END IF;

  -- Mode normal untuk kadus - hanya untuk penduduk dari dusun mereka
  IF user_role = 'kadus' AND form_visibility IN ('semua', 'tertentu') AND user_dusun = penduduk_dusun THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Buat fungsi bantu untuk mengecek akses INSERT
CREATE OR REPLACE FUNCTION can_insert_form_data(p_form_tugas_id UUID, p_penduduk_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_dusun TEXT;
  form_visibility TEXT;
  form_dusun_terpilih TEXT[];
  penduduk_dusun TEXT;
BEGIN
  -- Dapatkan informasi user
  SELECT role, dusun INTO user_role, user_dusun
  FROM public.profiles
  WHERE user_id = auth.uid();

  -- Admin bisa insert apapun
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Dapatkan informasi form
  SELECT visibilitas_dusun, dusun_terpilih INTO form_visibility, form_dusun_terpilih
  FROM form_tugas
  WHERE id = p_form_tugas_id;

  -- Dapatkan dusun penduduk
  SELECT dusun INTO penduduk_dusun
  FROM penduduk
  WHERE id = p_penduduk_id;

  -- Untuk kadus:
  IF user_role = 'kadus' THEN
    -- Mode 'semua_data' - bisa insert penduduk dari semua dusun
    IF form_visibility = 'semua_data' THEN
      RETURN TRUE;
    END IF;
    
    -- Mode 'semua' atau 'tertentu' - hanya untuk penduduk dari dusun mereka
    IF form_visibility IN ('semua', 'tertentu') AND user_dusun = penduduk_dusun THEN
      RETURN TRUE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Buat fungsi bantu untuk mengecek akses UPDATE
CREATE OR REPLACE FUNCTION can_update_form_data(p_form_data_id UUID, p_form_tugas_id UUID, p_penduduk_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  user_dusun TEXT;
  form_visibility TEXT;
  penduduk_dusun TEXT;
BEGIN
  -- Dapatkan informasi user
  SELECT role, dusun INTO user_role, user_dusun
  FROM public.profiles
  WHERE user_id = auth.uid();

  -- Admin bisa update apapun
  IF user_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- Jika user submit data ini, bisa update
  IF EXISTS (
    SELECT 1 FROM form_tugas_data 
    WHERE id = p_form_data_id AND user_id = auth.uid()
  ) THEN
    RETURN TRUE;
  END IF;

  -- Dapatkan informasi form
  SELECT visibilitas_dusun INTO form_visibility
  FROM form_tugas
  WHERE id = p_form_tugas_id;

  -- Dapatkan dusun penduduk
  SELECT dusun INTO penduduk_dusun
  FROM penduduk
  WHERE id = p_penduduk_id;

  -- Untuk kadus:
  IF user_role = 'kadus' THEN
    -- Mode 'semua_data' - bisa update semua data
    IF form_visibility = 'semua_data' THEN
      RETURN TRUE;
    END IF;
    
    -- Mode normal - hanya untuk penduduk dari dusun mereka
    IF form_visibility IN ('semua', 'tertentu') AND user_dusun = penduduk_dusun THEN
      RETURN TRUE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Berikan akses eksekusi ke fungsi-fungsi bantu
GRANT EXECUTE ON FUNCTION can_select_form_data TO authenticated;
GRANT EXECUTE ON FUNCTION can_insert_form_data TO authenticated;
GRANT EXECUTE ON FUNCTION can_update_form_data TO authenticated;

-- Sekarang buat kebijakan RLS yang sangat sederhana menggunakan fungsi bantu

-- Kebijakan SELECT yang aman
CREATE POLICY "Safe select policy for form_tugas_data"
ON form_tugas_data FOR SELECT
TO authenticated
USING (can_select_form_data(id));

-- Kebijakan INSERT yang aman
CREATE POLICY "Safe insert policy for form_tugas_data"
ON form_tugas_data FOR INSERT
TO authenticated
WITH CHECK (can_insert_form_data(form_tugas_id, penduduk_id));

-- Kebijakan UPDATE yang aman
CREATE POLICY "Safe update policy for form_tugas_data"
ON form_tugas_data FOR UPDATE
TO authenticated
USING (can_select_form_data(id))
WITH CHECK (can_update_form_data(id, form_tugas_id, penduduk_id));

-- Kebijakan DELETE hanya untuk admin
CREATE POLICY "Safe delete policy for form_tugas_data"
ON form_tugas_data FOR DELETE
TO authenticated
USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

-- Konfirmasi bahwa kebijakan telah diterapkan
-- SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'form_tugas_data';