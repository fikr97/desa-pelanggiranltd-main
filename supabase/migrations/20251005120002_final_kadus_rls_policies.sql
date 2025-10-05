-- MIGRASI KOMPLIT: Aktifkan RLS dan buat kebijakan untuk membatasi akses penduduk berdasarkan dusun

-- Pastikan RLS diaktifkan pada tabel penduduk
ALTER TABLE public.penduduk ENABLE ROW LEVEL SECURITY;

-- Hapus semua kebijakan lama untuk menghindari konflik
DROP POLICY IF EXISTS "Admin can manage all penduduk" ON public.penduduk;
DROP POLICY IF EXISTS "Kadus can manage their dusun penduduk" ON public.penduduk;
DROP POLICY IF EXISTS "Kadus can view their dusun penduduk" ON public.penduduk;
DROP POLICY IF EXISTS "Penduduk Select Policy - Admin and Kadus of their dusun" ON public.penduduk;
DROP POLICY IF EXISTS "Penduduk Insert Policy - Admin and Kadus of their dusun" ON public.penduduk;
DROP POLICY IF EXISTS "Penduduk Update Policy - Admin and Kadus of their dusun" ON public.penduduk;
DROP POLICY IF EXISTS "Penduduk Delete Policy - Admin and Kadus of their dusun" ON public.penduduk;

-- Kebijakan SELECT: Admin dapat melihat semua, Kadus hanya dapat melihat dusun mereka
CREATE POLICY "penduduk_select_policy" ON public.penduduk
FOR SELECT
USING (
  -- Admin dapat melihat semua data penduduk
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR
  -- Kadus hanya dapat melihat penduduk di dusun yang dikelolanya
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'kadus' 
    AND dusun = penduduk.dusun
  )
);

-- Kebijakan INSERT: Admin dapat menambah ke semua dusun, Kadus hanya ke dusun mereka
CREATE POLICY "penduduk_insert_policy" ON public.penduduk
FOR INSERT
WITH CHECK (
  -- Admin dapat menambah penduduk ke dusun mana pun
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR
  -- Kadus hanya dapat menambah penduduk ke dusun yang dikelolanya
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'kadus' 
    AND dusun = penduduk.dusun
  )
);

-- Kebijakan UPDATE: Admin dapat mengedit semua, Kadus hanya yang ada di dusun mereka
CREATE POLICY "penduduk_update_policy" ON public.penduduk
FOR UPDATE
USING (
  -- Admin dapat memulai update pada penduduk mana pun
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR
  -- Kadus hanya dapat memulai update pada penduduk di dusun mereka
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'kadus' 
    AND dusun = penduduk.dusun
  )
)
WITH CHECK (
  -- Admin dapat mengubah data penduduk sembarang
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR
  -- Kadus dapat mengubah data penduduk di dusun mereka
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'kadus' 
    AND dusun = penduduk.dusun
  )
);

-- Kebijakan DELETE: Admin dapat menghapus semua, Kadus hanya yang di dusun mereka
CREATE POLICY "penduduk_delete_policy" ON public.penduduk
FOR DELETE
USING (
  -- Admin dapat menghapus penduduk mana pun
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  OR
  -- Kadus hanya dapat menghapus penduduk di dusun yang dikelolanya
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'kadus' 
    AND dusun = penduduk.dusun
  )
);

-- Konfirmasi bahwa RLS telah diaktifkan
-- Anda bisa mengecek dengan menjalankan perintah berikut di SQL Editor:
-- SELECT schemaname, tablename, rowsecurity, policyallrequired FROM pg_tables WHERE tablename = 'penduduk';