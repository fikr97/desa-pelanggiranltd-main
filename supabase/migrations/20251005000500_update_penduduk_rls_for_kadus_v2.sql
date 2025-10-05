-- Memperbarui aturan RLS (Row Level Security) untuk tabel penduduk
-- Tujuan: Memungkinkan admin untuk melihat semua data penduduk
--        Memungkinkan kadus untuk hanya melihat data penduduk di dusun yang dikelolanya
--        Asumsi: Tabel penduduk terhubung ke tabel data_keluarga (via id_keluarga),
--                dan data_keluarga terhubung ke tabel wilayah (via id_wilayah).
--                Nama dusun disimpan di wilayah.nama.
--                Profil user (di profiles) menyimpan dusun yang dikelola di kolom profiles.dusun.

-- Hapus aturan lama dari file sebelumnya (jika berhasil diterapkan sebelumnya)
DROP POLICY IF EXISTS "Penduduk are viewable by admins and kadus of their dusun" ON penduduk;
DROP POLICY IF EXISTS "Penduduk are updateable by admins and kadus of their dusun" ON penduduk;
DROP POLICY IF EXISTS "Penduduk are insertable by admins and kadus of their dusun" ON penduduk;
DROP POLICY IF EXISTS "Penduduk are deletable by admins and kadus of their dusun" ON penduduk;

-- Aturan untuk SELECT: Admin atau Kadus dengan dusun cocok
CREATE POLICY "Penduduk are viewable by admins and kadus of their dusun"
  ON penduduk
  FOR SELECT
  USING (
    -- Admin selalu bisa
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Kadus bisa lihat penduduk di dusunnya
    (
      (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
      AND
      -- Hubungkan penduduk -> data_keluarga -> wilayah untuk mendapatkan nama dusun
      -- Asumsikan ada kolom id_keluarga di penduduk, dan id_wilayah di data_keluarga
      wilayah.nama = (SELECT dusun FROM profiles WHERE user_id = auth.uid())
      -- JOIN ini diasumsikan. Struktur sebenarnya bisa berbeda.
      -- Misalnya jika kolom di penduduk adalah id_keluarga, dan di data_keluarga adalah id_wilayah:
      -- AND wilayah.nama = (SELECT p.dusun FROM profiles p WHERE p.user_id = auth.uid())
      -- FROM penduduk pnd
      -- JOIN data_keluarga dk ON pnd.id_keluarga = dk.id
      -- JOIN wilayah w ON dk.id_wilayah = w.id
      -- WHERE w.nama = (SELECT p.dusun FROM profiles p WHERE p.user_id = auth.uid())
      -- Dalam klausa USING pada RLS, kita tidak bisa menggunakan FROM langsung seperti query biasa.
      -- Kita harus menggunakan subquery untuk membentuk hubungan.
    )
  );

-- Karena kita tidak bisa melakukan JOIN dalam klausa USING secara langsung dengan nama kolom,
-- kita perlu mendapatkan id_wilayah dari wilayah berdasarkan nama dusun di profiles.
-- Asumsikan struktur: penduduk.id_keluarga -> data_keluarga.id -> data_keluarga.id_wilayah -> wilayah.id
-- dan wilayah.nama = profiles.dusun

-- Aturan untuk SELECT (versi dengan subquery mendalam)
CREATE POLICY "Penduduk are viewable by admins and kadus of their dusun_v2"
  ON penduduk
  FOR SELECT
  USING (
    -- Admin selalu bisa
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    -- Kadus bisa lihat penduduk di dusunnya
    (
      (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
      AND
      -- Dapatkan id_wilayah dari tabel wilayah berdasarkan nama dusun yang dikelola oleh kadus
      id_keluarga IN (
        SELECT dk.id FROM data_keluarga dk
        JOIN wilayah w ON dk.id_wilayah = w.id
        WHERE w.nama = (SELECT p.dusun FROM profiles p WHERE p.user_id = auth.uid())
      )
      -- Kita asumsikan id_keluarga di tabel penduduk mengarah ke tabel data_keluarga
      -- Jika struktur berbeda, ini perlu disesuaikan
    )
  );

-- Aturan untuk UPDATE (menggunakan pendekatan yang sama)
CREATE POLICY "Penduduk are updateable by admins and kadus of their dusun_v2"
  ON penduduk
  FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    (
      (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
      AND
      id_keluarga IN (
        SELECT dk.id FROM data_keluarga dk
        JOIN wilayah w ON dk.id_wilayah = w.id
        WHERE w.nama = (SELECT p.dusun FROM profiles p WHERE p.user_id = auth.uid())
      )
    )
  );

-- Aturan untuk INSERT (menggunakan pendekatan yang sama)
-- Catatan: WITH CHECK digunakan untuk INSERT
CREATE POLICY "Penduduk are insertable by admins and kadus of their dusun_v2"
  ON penduduk
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    (
      (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
      AND
      -- Saat insert, kita perlu memastikan id_keluarga yang dipilih sesuai dengan dusun kadus
      -- Ini bisa kompleks dan tergantung UI. Diasumsikan UI menangani ini.
      -- Atau, kita bisa memaksa id_keluarga harus berasal dari keluarga di dusun yang sesuai.
      id_keluarga IN (
        SELECT dk.id FROM data_keluarga dk
        JOIN wilayah w ON dk.id_wilayah = w.id
        WHERE w.nama = (SELECT p.dusun FROM profiles p WHERE p.user_id = auth.uid())
      )
    )
  );

-- Aturan untuk DELETE
CREATE POLICY "Penduduk are deletable by admins and kadus of their dusun_v2"
  ON penduduk
  FOR DELETE
  USING (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
    OR
    (
      (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'kadus'
      AND
      id_keluarga IN (
        SELECT dk.id FROM data_keluarga dk
        JOIN wilayah w ON dk.id_wilayah = w.id
        WHERE w.nama = (SELECT p.dusun FROM profiles p WHERE p.user_id = auth.uid())
      )
    )
  );

-- Catatan: File ini mengasumsikan:
-- 1. Tabel 'penduduk' memiliki kolom 'id_keluarga' yang menghubungkannya ke tabel 'data_keluarga'.
-- 2. Tabel 'data_keluarga' memiliki kolom 'id_wilayah' yang menghubungkannya ke tabel 'wilayah'.
-- 3. Tabel 'wilayah' memiliki kolom 'nama' yang menyimpan nama dusun.
-- 4. Tabel 'profiles' (kolom 'dusun') menyimpan nama dusun yang dikelola oleh kadus.

-- Jika struktur tabel berbeda, file ini HARUS disesuaikan.
-- Misalnya, jika id_wilayah ada langsung di tabel 'penduduk', maka subquery menjadi:
/*
      id_wilayah IN (
        SELECT w.id FROM wilayah w
        WHERE w.nama = (SELECT p.dusun FROM profiles p WHERE p.user_id = auth.uid())
      )
*/

-- Juga, jika data penduduk sebenarnya disimpan di tabel 'data_keluarga', maka file migrasi yang perlu diubah adalah untuk 'data_keluarga', bukan 'penduduk'.