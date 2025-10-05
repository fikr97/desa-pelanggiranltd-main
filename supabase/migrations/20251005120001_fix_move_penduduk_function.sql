-- Memastikan fungsi move_penduduk berfungsi dengan benar setelah perubahan RLS
-- Fungsi ini memungkinkan kadus untuk memindahkan penduduk dari dusun mereka ke dusun lain

-- Hapus fungsi lama jika ada
DROP FUNCTION IF EXISTS move_penduduk(UUID, TEXT);

-- Buat fungsi move_penduduk yang baru dengan keamanan yang tepat
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

  -- Dapatkan dusun saat ini dari penduduk yang akan dipindahkan
  SELECT dusun INTO resident_current_dusun 
  FROM public.penduduk 
  WHERE id = resident_id;

  -- PERIKSA KEAMANAN: Hanya izinkan admin atau Kadus yang benar untuk melakukan pemindahan
  IF caller_role = 'admin' OR (caller_role = 'kadus' AND caller_dusun = resident_current_dusun) THEN
    -- Jika pemeriksaan lolos, lakukan update dengan hak akses SECURITY DEFINER
    UPDATE public.penduduk
    SET dusun = new_dusun
    WHERE id = resident_id;
  ELSE
    -- Jika pemeriksaan gagal, munculkan pengecualian
    RAISE EXCEPTION 'Pengguna tidak memiliki izin untuk memindahkan penduduk ini.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pastikan fungsi memiliki hak akses yang benar
GRANT EXECUTE ON FUNCTION move_penduduk TO authenticated;