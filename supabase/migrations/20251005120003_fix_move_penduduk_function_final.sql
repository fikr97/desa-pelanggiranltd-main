-- MEMPERBAIKI FUNGSI move_penduduk DENGAN KEAMANAN YANG LEBIH BAIK

-- Hapus fungsi lama jika ada
DROP FUNCTION IF EXISTS move_penduduk(UUID, TEXT);

-- Buat fungsi move_penduduk dengan keamanan maksimal
CREATE OR REPLACE FUNCTION move_penduduk(resident_id UUID, new_dusun TEXT)
RETURNS VOID AS $$
DECLARE
  caller_role TEXT;
  caller_dusun TEXT;
  resident_current_dusun TEXT;
BEGIN
  -- Dapatkan role dan dusun dari pengguna yang memanggil fungsi
  SELECT role, dusun INTO caller_role, caller_dusun 
  FROM public.profiles 
  WHERE user_id = auth.uid();

  -- Periksa apakah user adalah admin
  IF caller_role = 'admin' THEN
    -- Admin dapat memindahkan penduduk ke dusun mana saja
    UPDATE public.penduduk
    SET dusun = new_dusun
    WHERE id = resident_id;
  ELSIF caller_role = 'kadus' THEN
    -- Kadus hanya dapat memindahkan penduduk dari dusun mereka sendiri
    SELECT dusun INTO resident_current_dusun 
    FROM public.penduduk 
    WHERE id = resident_id;

    -- Periksa apakah penduduk saat ini berada di dusun kadus yang sama
    IF resident_current_dusun = caller_dusun THEN
      UPDATE public.penduduk
      SET dusun = new_dusun
      WHERE id = resident_id;
    ELSE
      RAISE EXCEPTION 'Anda hanya dapat memindahkan penduduk dari dusun Anda sendiri.';
    END IF;
  ELSE
    RAISE EXCEPTION 'Hanya admin atau kadus yang dapat menggunakan fungsi ini.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Beri izin eksekusi ke authenticated users
GRANT EXECUTE ON FUNCTION move_penduduk TO authenticated;