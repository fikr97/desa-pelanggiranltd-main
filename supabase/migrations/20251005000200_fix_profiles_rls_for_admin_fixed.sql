-- Memperbarui aturan RLS (Row Level Security) untuk tabel profiles
-- Tujuan: Memungkinkan admin untuk melihat, mengedit, dan menghapus semua profil
-- Profil masih bisa diakses oleh pemiliknya sendiri (user_id = auth.uid())
-- Perbaikan: Gunakan fungsi aman untuk mengecek role admin, hindari subquery ke profiles

-- Hapus aturan lama jika ada (ganti NAMA_ATURAN_LAMA dengan nama sebenarnya jika diketahui)
-- Kita coba drop aturan-aturan yang akan kita buat, menggunakan IF EXISTS untuk keamanan
-- Diasumsikan nama-nama aturan ini mungkin sudah ada dari migrasi sebelumnya
DROP POLICY IF EXISTS "Profiles are viewable by owners and admins" ON profiles;
DROP POLICY IF EXISTS "Profiles are updateable by owners and admins" ON profiles;
DROP POLICY IF EXISTS "Profiles are deleteable by admins" ON profiles;

-- Aturan untuk SELECT: Pemilik atau Admin (menggunakan fungsi aman is_user_admin)
CREATE POLICY "Profiles are viewable by owners and admins"
  ON profiles
  FOR SELECT
  USING (
    -- Profil bisa dilihat oleh pemiliknya sendiri
    user_id = auth.uid()
    OR
    -- Atau jika user adalah admin (cek via fungsi aman yang tidak memicu RLS pada profiles)
    is_user_admin(auth.uid()) -- Asumsi: Fungsi ini telah dibuat dan aman
  );

-- Aturan untuk UPDATE: Pemilik atau Admin
CREATE POLICY "Profiles are updateable by owners and admins"
  ON profiles
  FOR UPDATE
  USING (
    -- Profil bisa diupdate oleh pemiliknya sendiri
    user_id = auth.uid()
    OR
    -- Atau jika user adalah admin (cek via fungsi aman)
    is_user_admin(auth.uid()) -- Asumsi: Fungsi ini telah dibuat dan aman
  );

-- Aturan untuk INSERT: Biasanya hanya bisa dilakukan oleh fungsi server-side (seperti create-new-user),
-- jadi kita bisa biarkan sesuai kebijakan atau fungsi pembuatan. Kita fokus ke SELECT/UPDATE/DELETE di sini.
-- Jika ingin, bisa ditambahkan aturan INSERT terpisah jika diperlukan di masa depan.

-- Aturan untuk DELETE: Hanya Admin
CREATE POLICY "Profiles are deleteable by admins"
  ON profiles
  FOR DELETE
  USING (
    -- Hanya jika user adalah admin (cek via fungsi aman)
    is_user_admin(auth.uid()) -- Asumsi: Fungsi ini telah dibuat dan aman
  );

-- Catatan Penting:
-- Fungsi `is_user_admin(user_id uuid)` atau mekanisme serupa HARUS telah dibuat
-- sebelumnya di Supabase Anda (misalnya via SQL Editor atau file migrasi lain).
-- Contoh fungsi (harus dibuat terpisah sebelum menjalankan migrasi ini):
/*
CREATE OR REPLACE FUNCTION is_user_admin(input_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Penting agar fungsi bisa mengakses data lain
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Dapatkan role dari tabel profiles
    SELECT p.role INTO user_role
    FROM profiles p
    WHERE p.user_id = input_user_id;

    -- Kembalikan true jika role adalah admin
    RETURN user_role = 'admin';
END;
$$;

-- Beri izin agar service_role bisa menjalankan fungsi ini
GRANT EXECUTE ON FUNCTION is_user_admin TO service_role;
*/
-- Anda harus membuat fungsi di atas (atau yang setara) sebelum menjalankan migrasi ini.