-- PEMBERSIHAN DAN PENGATURAN ULANG KEBIJAKAN RLS UNTUK TABEL PENDUDUK

-- LANGKAH 1: NONAKTIFKAN RLS SEMENTARA
ALTER TABLE public.penduduk DISABLE ROW LEVEL SECURITY;

-- LANGKAH 2: HAPUS SEMUA KEBIJAKAN LAMA
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'penduduk'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.penduduk';
    END LOOP;
END $$;

-- LANGKAH 3: HAPUS FUNGSI LAMA move_penduduk
DROP FUNCTION IF EXISTS move_penduduk(UUID, TEXT);

-- LANGKAH 4: AKTIFKAN KEMBALI RLS
ALTER TABLE public.penduduk ENABLE ROW LEVEL SECURITY;

-- LANGKAH 5: BUAT FUNGSI PEMBANTU (Jika diperlukan - opsional)
-- Biasanya menggunakan subquery langsung lebih aman untuk RLS
-- Tapi jika diperlukan, berikut contohnya:

-- LANGKAH 6: BUAT KEBIJAKAN BARU YANG JELAS

-- Kebijakan SELECT: Hanya admin bisa lihat semua, kadus hanya lihat dusun mereka
CREATE POLICY "penduduk_select_policy" ON public.penduduk
FOR SELECT
USING (
  -- Untuk admin: bisa lihat semua
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Untuk kadus: hanya lihat penduduk di dusun mereka
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = penduduk.dusun
  )
);

-- Kebijakan INSERT: Hanya admin bisa insert tanpa batas, kadus hanya ke dusun mereka
CREATE POLICY "penduduk_insert_policy" ON public.penduduk
FOR INSERT
WITH CHECK (
  -- Untuk admin: bisa insert ke mana saja
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Untuk kadus: hanya bisa insert ke dusun mereka
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = penduduk.dusun
  )
);

-- Kebijakan UPDATE: Hanya admin bisa update semua, kadus hanya yang dari dusun mereka
CREATE POLICY "penduduk_update_policy" ON public.penduduk
FOR UPDATE
USING (
  -- Untuk admin: bisa update semua
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Untuk kadus: hanya bisa update penduduk dari dusun mereka
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = penduduk.dusun
  )
)
WITH CHECK (
  -- Untuk admin: bisa mengganti ke nilai apa pun
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Untuk kadus: hanya bisa update jika tetap di dusun mereka
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = penduduk.dusun
  )
);

-- Kebijakan DELETE: Hanya admin bisa hapus semua, kadus hanya yang dari dusun mereka
CREATE POLICY "penduduk_delete_policy" ON public.penduduk
FOR DELETE
USING (
  -- Untuk admin: bisa hapus semua
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Untuk kadus: hanya bisa hapus penduduk dari dusun mereka
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = penduduk.dusun
  )
);

-- LANGKAH 7: BUAT FUNGSI move_penduduk UNTUK PEMINDAHAN DUSUN YANG AMAN
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

  -- Dapatkan dusun saat ini dari penduduk
  SELECT dusun INTO resident_current_dusun 
  FROM public.penduduk 
  WHERE id = resident_id;

  -- Periksa akses berdasarkan role
  IF caller_role = 'admin' THEN
    -- Admin dapat memindahkan ke mana saja
    UPDATE public.penduduk
    SET dusun = new_dusun
    WHERE id = resident_id;
  ELSIF caller_role = 'kadus' AND caller_dusun = resident_current_dusun THEN
    -- Kadus hanya dapat memindahkan penduduk dari dusun mereka
    UPDATE public.penduduk
    SET dusun = new_dusun
    WHERE id = resident_id;
  ELSE
    -- Akses ditolak
    RAISE EXCEPTION 'Anda tidak memiliki izin untuk memindahkan penduduk ini';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Beri hak eksekusi ke pengguna terotentikasi
GRANT EXECUTE ON FUNCTION move_penduduk TO authenticated;

-- LANGKAH 8: VERIFIKASI
-- Anda dapat memverifikasi kebijakan dengan perintah berikut:
-- SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'penduduk';