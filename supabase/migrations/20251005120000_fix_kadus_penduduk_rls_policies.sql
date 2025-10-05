-- Membuat kebijakan RLS (Row Level Security) yang benar untuk tabel penduduk
-- Tujuan: 
-- 1. Admin dapat melihat, mengedit, menambah, dan menghapus semua data penduduk
-- 2. Kadus hanya dapat melihat, mengedit, menambah, dan menghapus data penduduk di dusun yang dikelolanya
-- 3. Kolom 'dusun' pada tabel penduduk cocok dengan kolom 'dusun' pada tabel profiles pengguna

-- Hapus semua kebijakan RLS lama untuk tabel penduduk
DROP POLICY IF EXISTS "Admin can manage all penduduk" ON public.penduduk;
DROP POLICY IF EXISTS "Kadus can manage their dusun penduduk" ON public.penduduk;
DROP POLICY IF EXISTS "Kadus can view their dusun penduduk" ON public.penduduk;
DROP POLICY IF EXISTS "penduduk_select_policy" ON public.penduduk;
DROP POLICY IF EXISTS "penduduk_insert_policy" ON public.penduduk;
DROP POLICY IF EXISTS "penduduk_update_policy" ON public.penduduk;
DROP POLICY IF EXISTS "penduduk_delete_policy" ON public.penduduk;

-- Kebijakan SELECT: Admin dapat melihat semua, Kadus hanya dapat melihat dusun mereka
CREATE POLICY "Penduduk Select Policy - Admin and Kadus of their dusun"
  ON public.penduduk
  FOR SELECT
  USING (
    -- Admin dapat melihat semua data penduduk
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Kadus hanya dapat melihat penduduk di dusun yang dikelolanya
    (
      (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
      AND
      penduduk.dusun = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Kebijakan INSERT: Admin dapat menambah ke semua dusun, Kadus hanya ke dusun mereka
CREATE POLICY "Penduduk Insert Policy - Admin and Kadus of their dusun"
  ON public.penduduk
  FOR INSERT
  WITH CHECK (
    -- Admin dapat menambah penduduk ke dusun mana pun
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Kadus hanya dapat menambah penduduk ke dusun yang dikelolanya
    (
      (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
      AND
      penduduk.dusun = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Kebijakan UPDATE: Admin dapat mengedit semua, Kadus hanya yang ada di dusun mereka
CREATE POLICY "Penduduk Update Policy - Admin and Kadus of their dusun"
  ON public.penduduk
  FOR UPDATE
  USING (
    -- Admin dapat memulai update pada penduduk mana pun
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Kadus hanya dapat memulai update pada penduduk di dusun mereka
    (
      (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
      AND
      penduduk.dusun = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    -- Admin dapat mengubah data penduduk sembarang
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Kadus dapat mengubah data penduduk di dusun mereka
    -- TAPI tidak dapat mengganti dusun ke dusun lain (akan ditangani oleh fungsi move_penduduk)
    (
      (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
      AND
      penduduk.dusun = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Kebijakan DELETE: Admin dapat menghapus semua, Kadus hanya yang di dusun mereka
CREATE POLICY "Penduduk Delete Policy - Admin and Kadus of their dusun"
  ON public.penduduk
  FOR DELETE
  USING (
    -- Admin dapat menghapus penduduk mana pun
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Kadus hanya dapat menghapus penduduk di dusun yang dikelolanya
    (
      (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
      AND
      penduduk.dusun = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
    )
  );

-- Pastikan RLS diaktifkan pada tabel penduduk
ALTER TABLE public.penduduk ENABLE ROW LEVEL SECURITY;