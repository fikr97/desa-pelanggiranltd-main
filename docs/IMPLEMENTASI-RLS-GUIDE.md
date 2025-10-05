# PANDUAN IMPLEMENTASI RLS KADUS

Ikuti langkah-langkah berikut untuk mengimplementasikan pembatasan akses kadus:

## LANGKAH 1: CEK STRUKTUR TABEL

Sebelum menjalankan migrasi, pastikan struktur tabel benar:

```sql
-- Cek tabel penduduk
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'penduduk' AND table_schema = 'public'
AND column_name IN ('dusun', 'id');

-- Cek tabel profiles  
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
AND column_name IN ('user_id', 'dusun', 'role');
```

## LANGKAH 2: JALANKAN MIGRASI PENUH (GABUNGAN DARI FILE YANG DIBUAT)

Salin dan tempel semua SQL berikut ke SQL Editor Supabase:

```sql
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

-- LANGKAH 5: BUAT KEBIJAKAN BARU YANG JELAS

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

-- LANGKAH 6: BUAT FUNGSI move_penduduk UNTUK PEMINDAHAN DUSUN YANG AMAN
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

-- LANGKAH 7: VERIFIKASI PENERAPAN
SELECT policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'penduduk';
```

## LANGKAH 3: VERIFIKASI IMPLEMENTASI

Setelah menjalankan migrasi, coba login dengan akun kadus dan periksa apakah mereka hanya bisa melihat penduduk dari dusun mereka.

## LANGKAH 4: TROUBLESHOOTING

Jika RLS tetap tidak bekerja:

1. Pastikan fitur RLS benar-benar aktif di konfigurasi Supabase
2. Cek apakah akun kadus memiliki `role = 'kadus'` dan `dusun` yang benar di tabel `profiles`
3. Pastikan nilai `dusun` di tabel `penduduk` dan `profiles` cocok persis (case-sensitive)
4. Coba query manual di SQL Editor sebagai pengguna auth untuk menguji:

```sql
-- Ganti 'user-id-anda' dengan ID user aktual
-- Untuk pengujian, Anda bisa menggunakan:
SELECT nama, dusun FROM penduduk LIMIT 10;
-- Ini seharusnya hanya menampilkan penduduk dari dusun kadus yang sedang login
```