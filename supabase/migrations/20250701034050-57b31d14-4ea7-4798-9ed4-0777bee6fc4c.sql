
-- Hapus bucket lama jika ada
DELETE FROM storage.buckets WHERE id = 'surat-docx';

-- Buat ulang bucket surat-docx sebagai public
INSERT INTO storage.buckets (id, name, public)
VALUES ('surat-docx', 'surat-docx', true);

-- Hapus semua policy lama untuk bucket ini
DROP POLICY IF EXISTS "Allow authenticated users to upload template files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update template files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete template files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to view surat files" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for DOCX files" ON storage.objects;

-- Buat policy yang lebih permisif untuk semua operasi pada bucket surat-docx
CREATE POLICY "Allow all operations on surat-docx bucket" ON storage.objects
FOR ALL USING (bucket_id = 'surat-docx');
