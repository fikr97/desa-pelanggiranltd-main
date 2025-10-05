-- Memperbarui aturan RLS (Row Level Security) untuk tabel profiles
-- Tujuan: Memungkinkan admin untuk melihat, mengedit, dan menghapus semua profil
-- Profil masih bisa diakses oleh pemiliknya sendiri (user_id = auth.uid())

-- Hapus aturan lama jika ada (ganti NAMA_ATURAN_LAMA dengan nama sebenarnya jika diketahui)
-- Kita coba drop aturan-aturan yang akan kita buat, menggunakan IF EXISTS untuk keamanan
-- Diasumsikan nama-nama aturan ini mungkin sudah ada dari migrasi sebelumnya
DROP POLICY IF EXISTS "Profiles are viewable by owners and admins" ON profiles;
DROP POLICY IF EXISTS "Profiles are updateable by owners and admins" ON profiles;
DROP POLICY IF EXISTS "Profiles are deleteable by admins" ON profiles;

-- Aturan untuk SELECT: Pemilik atau Admin
CREATE POLICY "Profiles are viewable by owners and admins"
  ON profiles
  FOR SELECT
  USING (
    -- Profil bisa dilihat oleh pemiliknya sendiri
    user_id = auth.uid()
    OR
    -- Atau jika user adalah admin (cek role langsung)
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
  );

-- Aturan untuk UPDATE: Pemilik atau Admin
CREATE POLICY "Profiles are updateable by owners and admins"
  ON profiles
  FOR UPDATE
  USING (
    -- Profil bisa diupdate oleh pemiliknya sendiri
    user_id = auth.uid()
    OR
    -- Atau jika user adalah admin (cek role langsung)
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
  );

-- Aturan untuk INSERT: Biasanya hanya bisa dilakukan oleh fungsi server-side (seperti create-new-user),
-- jadi kita bisa biarkan sesuai kebijakan atau fungsi pembuatan. Kita fokus ke SELECT/UPDATE/DELETE di sini.
-- Jika ingin, bisa ditambahkan aturan INSERT terpisah jika diperlukan di masa depan.

-- Aturan untuk DELETE: Hanya Admin
-- (Operasi delete mungkin lebih aman dilakukan lewat fungsi server-side, namun untuk UI jika diperlukan)
CREATE POLICY "Profiles are deleteable by admins"
  ON profiles
  FOR DELETE
  USING (
    -- Hanya jika user adalah admin (cek role langsung)
    (SELECT role FROM profiles WHERE user_id = auth.uid()) = 'admin'
  );

-- Catatan: Jika Anda ingin menggunakan sistem permission (misalnya button:view:profile, button:edit:profile, dll.)
-- maka 'admin' check di atas perlu diganti dengan pemanggilan fungsi has_permission yang sesuai.
-- Misalnya: OR (SELECT has_permission('button:view:profile') FROM profiles WHERE user_id = auth.uid()).
-- Namun, karena admin dianggap memiliki semua izin secara implisit di frontend,
-- maka mengecek role secara langsung seringkali lebih efisien untuk RLS.