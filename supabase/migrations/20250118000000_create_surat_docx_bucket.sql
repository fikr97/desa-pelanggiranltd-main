

-- Create storage bucket for DOCX files
INSERT INTO storage.buckets (id, name, public)
VALUES ('surat-docx', 'surat-docx', true);

-- Create policy to allow all operations on surat-docx bucket
CREATE POLICY "Allow all operations on surat-docx bucket" ON storage.objects
FOR ALL USING (bucket_id = 'surat-docx');

