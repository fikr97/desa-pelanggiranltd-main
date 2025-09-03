
-- Membuat bucket penyimpanan untuk logo desa, jika belum ada.
-- Bucket ini akan bersifat publik agar logo dapat ditampilkan di situs web Anda.
-- Saya juga menambahkan batasan ukuran file (5MB) dan tipe file yang diizinkan (gambar).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('logo-desa', 'logo-desa', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- Menghapus kebijakan yang mungkin sudah ada untuk menghindari konflik.
DROP POLICY IF EXISTS "Public read access for logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage logos" ON storage.objects;

-- Memberikan akses baca publik untuk semua file di bucket 'logo-desa'.
CREATE POLICY "Public read access for logos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'logo-desa' );

-- Memberikan izin kepada pengguna yang terautentikasi untuk mengelola (upload, update, delete) file di bucket 'logo-desa'.
CREATE POLICY "Authenticated users can manage logos"
ON storage.objects FOR ALL
TO authenticated
USING ( bucket_id = 'logo-desa' )
WITH CHECK ( bucket_id = 'logo-desa' );
