-- Memperbarui aturan RLS (Row Level Security) untuk tabel penduduk
-- Tujuan: Memungkinkan admin untuk melihat semua data penduduk
--        Memungkinkan kadus untuk hanya melihat data penduduk di dusun yang dikelolanya
--        Profil user (dari auth.users) digunakan untuk menentukan dusun untuk kadus

-- Asumsi: Tabel penduduk memiliki kolom 'dusun' yang berisi nama dusun.
-- Asumsi: Struktur tabel penduduk mirip dengan data_keluarga

-- Hapus aturan lama jika ada (gunakan nama aturan sebelumnya jika diketahui)
-- Misalnya, jika sebelumnya ada aturan seperti "Penduduk are viewable by admins" dsb.
-- DROP POLICY IF EXISTS "Penduduk are viewable by admins" ON penduduk;
-- DROP POLICY IF EXISTS "Penduduk are viewable by kadus" ON penduduk;
-- ... (ganti dengan nama-nama aturan yang sebenarnya)

-- Hapus aturan lama terlebih dahulu menggunakan DROP POLICY IF EXISTS
-- Ganti nama aturan dengan nama yang sesungguhnya jika diketahui
-- Kita coba dengan nama yang digunakan dalam file ini
DROP POLICY IF EXISTS "Penduduk are viewable by admins and kadus of their dusun" ON penduduk;
DROP POLICY IF EXISTS "Penduduk are updateable by admins and kadus of their dusun" ON penduduk;
DROP POLICY IF EXISTS "Penduduk are insertable by admins and kadus of their dusun" ON penduduk;
DROP POLICY IF EXISTS "Penduduk are deletable by admins and kadus of their dusun" ON penduduk;

-- Kita buat aturan SELECT untuk penduduk
CREATE POLICY "Penduduk are viewable by admins and kadus of their dusun"
  ON penduduk -- Ganti 'penduduk' dengan nama tabel sebenarnya jika berbeda
  FOR SELECT
  USING (
    -- Admin selalu bisa melihat semua
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Kadus bisa melihat data di dusun yang dikelolanya
    (
      (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
      AND
      dusun = (SELECT dusun FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Aturan untuk UPDATE (jika diizinkan)
-- Sama seperti SELECT, hanya admin dan kadus dari dusun yang sama
CREATE POLICY "Penduduk are updateable by admins and kadus of their dusun"
  ON penduduk -- Ganti 'penduduk' dengan nama tabel sebenarnya jika berbeda
  FOR UPDATE
  USING (
    -- Admin selalu bisa
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Kadus bisa update penduduk di dusunnya
    (
      (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
      AND
      dusun = (SELECT dusun FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Aturan untuk INSERT (jika diperlukan dan diizinkan)
-- Sama seperti SELECT/UPDATE
CREATE POLICY "Penduduk are insertable by admins and kadus of their dusun"
  ON penduduk -- Ganti 'penduduk' dengan nama tabel sebenarnya jika berbeda
  FOR INSERT
  WITH CHECK (
    -- Admin selalu bisa
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Kadus hanya bisa insert jika dusun sesuai
    (
      (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
      AND
      dusun = (SELECT dusun FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Aturan untuk DELETE (jika diizinkan, biasanya hanya Admin)
-- Ganti dengan hanya admin jika ingin membatasi
CREATE POLICY "Penduduk are deletable by admins and kadus of their dusun"
  ON penduduk -- Ganti 'penduduk' dengan nama tabel sebenarnya jika berbeda
  FOR DELETE
  USING (
    -- Admin selalu bisa
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Kadus bisa delete penduduk di dusunnya
    (
      (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
      AND
      dusun = (SELECT dusun FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Jika data penduduk disimpan di tabel lain (seperti data_keluarga), ulangi aturan serupa untuk tabel tersebut.
-- Contoh untuk data_keluarga (jika kolom dusun ada di sana):
/*
DROP POLICY IF EXISTS "Data Keluarga are viewable by admins and kadus of their dusun" ON data_keluarga;
CREATE POLICY "Data Keluarga are viewable by admins and kadus of their dusun"
  ON data_keluarga
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    (
      (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
      AND
      dusun = (SELECT dusun FROM profiles WHERE user_id = auth.uid())
    )
  );
-- Ulangi juga untuk UPDATE, INSERT, DELETE jika diperlukan dengan nama tabel yang benar
*/