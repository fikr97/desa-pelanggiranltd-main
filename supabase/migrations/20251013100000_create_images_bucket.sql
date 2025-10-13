-- Create a storage bucket for images
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('form_images', 'form_images', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create policies to allow authenticated users to upload images
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'form_images');

-- Create policies to allow authenticated users to read images
CREATE POLICY "Allow authenticated users to read images" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'form_images');

-- Create policies to allow users to update their own images
CREATE POLICY "Allow users to update their own images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'form_images' AND auth.uid()::text = owner_id::text);

-- Create policies to allow users to delete their own images
CREATE POLICY "Allow users to delete their own images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'form_images' AND auth.uid()::text = owner_id::text);

-- Grant storage roles
GRANT ALL ON storage.objects TO authenticated;