
-- Menghapus kebijakan yang salah dari percobaan sebelumnya
DROP POLICY IF EXISTS "Authenticated users can manage their own logos" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access for logos" ON storage.objects;

-- Kebijakan baru yang mengizinkan SIAPA SAJA (termasuk pengunjung non-login) 
-- untuk mengunggah file ke dalam bucket 'logo-desa'.
CREATE POLICY "Public upload access for logos"
ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'logo-desa' );

-- Kebijakan untuk mengizinkan pengguna yang terautentikasi untuk MEMPERBARUI logo mereka.
CREATE POLICY "Authenticated users can update their own logos"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'logo-desa' AND auth.uid() = owner );

-- Kebijakan untuk mengizinkan pengguna yang terautentikasi untuk MENGHAPUS logo mereka.
CREATE POLICY "Authenticated users can delete their own logos"
ON storage.objects FOR DELETE
USING ( bucket_id = 'logo-desa' AND auth.uid() = owner );
