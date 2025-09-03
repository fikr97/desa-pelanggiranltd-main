-- Create storage bucket for content images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('content-images', 'content-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for content images
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'content-images');

CREATE POLICY "Admin can upload content images" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'content-images' AND is_admin(auth.uid()));

CREATE POLICY "Admin can update content images" ON storage.objects FOR UPDATE 
USING (bucket_id = 'content-images' AND is_admin(auth.uid()));

CREATE POLICY "Admin can delete content images" ON storage.objects FOR DELETE 
USING (bucket_id = 'content-images' AND is_admin(auth.uid()));