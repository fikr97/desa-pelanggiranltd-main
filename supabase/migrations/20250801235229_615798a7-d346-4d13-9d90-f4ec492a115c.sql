-- Create table for content management (sejarah desa, visi misi, kondisi geografis, dll)
CREATE TABLE IF NOT EXISTS public.konten_website (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  jenis VARCHAR NOT NULL, -- 'sejarah', 'visi_misi', 'geografis', 'tupoksi', 'pengumuman', 'agenda'
  judul TEXT NOT NULL,
  konten TEXT NOT NULL,
  gambar TEXT,
  urutan INTEGER DEFAULT 0,
  status VARCHAR DEFAULT 'published', -- 'published', 'draft'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.konten_website ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "All can view published konten" 
ON public.konten_website 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Admin can manage konten" 
ON public.konten_website 
FOR ALL 
USING (is_admin(auth.uid()));

-- Add index for better performance
CREATE INDEX idx_konten_website_jenis ON public.konten_website(jenis);
CREATE INDEX idx_konten_website_status ON public.konten_website(status);