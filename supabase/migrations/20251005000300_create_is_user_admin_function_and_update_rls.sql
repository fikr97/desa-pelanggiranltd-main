-- 1. Buat fungsi is_user_admin yang aman untuk digunakan dalam RLS
-- Fungsi ini akan mengecek role user dari tabel profiles tanpa memicu RLS itu sendiri
-- karena menggunakan SECURITY DEFINER

CREATE OR REPLACE FUNCTION is_user_admin(input_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Penting agar fungsi bisa mengakses data lain di bawah role pemanggil (service_role)
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Dapatkan role dari tabel profiles
    -- Karena SECURITY DEFINER digunakan, pastikan fungsi ini aman dari SQL injection jika input_user_id berasal dari pengguna.
    -- Dalam konteks RLS, input_user_id berasal dari auth.uid(), yang relatif aman.
    SELECT p.role INTO user_role
    FROM profiles p
    WHERE p.user_id = input_user_id;

    -- Kembalikan true jika role adalah admin
    RETURN user_role = 'admin';
END;
$$;

-- Beri izin agar service_role bisa menjalankan fungsi ini (penting untuk RLS)
GRANT EXECUTE ON FUNCTION is_user_admin TO service_role;

-- 2. Sekarang perbarui RLS untuk profiles menggunakan fungsi yang baru dibuat
-- Hapus aturan lama jika ada
DROP POLICY IF EXISTS "Profiles are viewable by owners and admins" ON profiles;
DROP POLICY IF EXISTS "Profiles are updateable by owners and admins" ON profiles;
DROP POLICY IF EXISTS "Profiles are deleteable by admins" ON profiles;

-- Aturan untuk SELECT: Pemilik atau Admin (menggunakan fungsi is_user_admin)
CREATE POLICY "Profiles are viewable by owners and admins"
  ON profiles
  FOR SELECT
  USING (
    -- Profil bisa dilihat oleh pemiliknya sendiri
    user_id = auth.uid()
    OR
    -- Atau jika user adalah admin (cek via fungsi aman)
    is_user_admin(auth.uid())
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
    is_user_admin(auth.uid())
  );

-- Aturan untuk DELETE: Hanya Admin
CREATE POLICY "Profiles are deleteable by admins"
  ON profiles
  FOR DELETE
  USING (
    -- Hanya jika user adalah admin (cek via fungsi aman)
    is_user_admin(auth.uid())
  );

-- Catatan: Jika Anda ingin fitur Manajemen User hanya menampilkan profil lain *jika* pengguna
-- memiliki permission tertentu (misalnya 'button:view:manajemen_user' seperti yang sudah ada),
-- Anda bisa mengganti is_user_admin(auth.uid()) di atas dengan pemanggilan ke fungsi
-- yang mengecek permission, misalnya check_permission(auth.uid(), 'button:view:manajemen_user').
-- Namun, karena admin dianggap memiliki semua izin, is_user_admin adalah pendekatan yang masuk akal.