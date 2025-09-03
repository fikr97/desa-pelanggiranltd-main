-- Create user profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nama text NOT NULL,
  email text,
  dusun text,
  role text NOT NULL DEFAULT 'kadus' CHECK (role IN ('admin', 'kadus')),
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nama, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email), 
    NEW.email,
    'kadus'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add RLS policies for existing tables based on user roles
-- Penduduk table - Kadus can only see their dusun
CREATE POLICY "Kadus can view their dusun penduduk" 
ON public.penduduk 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND (role = 'admin' OR (role = 'kadus' AND dusun = penduduk.dusun))
  )
);

CREATE POLICY "Admin can manage all penduduk" 
ON public.penduduk 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Kadus can manage their dusun penduduk" 
ON public.penduduk 
FOR INSERT, UPDATE, DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'kadus' 
    AND dusun = penduduk.dusun
  )
);

-- Surat template - Only admin can manage
CREATE POLICY "Only admin can manage surat template" 
ON public.surat_template 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "All authenticated users can view surat template" 
ON public.surat_template 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Surat - All can create, but kadus limited to their dusun
CREATE POLICY "Users can create surat" 
ON public.surat 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view and manage their surat" 
ON public.surat 
FOR SELECT, UPDATE, DELETE
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR 
    created_by = auth.uid()::text
  )
);

-- Enable RLS on tables that don't have it
ALTER TABLE public.penduduk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surat_template ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surat_field_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perangkat_desa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.berita ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.halaman_informasi ENABLE ROW LEVEL SECURITY;

-- Add policies for other tables - admin only for backend management
CREATE POLICY "Admin can manage perangkat desa" 
ON public.perangkat_desa 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "All can view perangkat desa" 
ON public.perangkat_desa 
FOR SELECT 
USING (true);

-- Similar policies for content management tables
CREATE POLICY "Admin can manage berita" 
ON public.berita 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "All can view published berita" 
ON public.berita 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Admin can manage galeri" 
ON public.galeri 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "All can view published galeri" 
ON public.galeri 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Admin can manage halaman informasi" 
ON public.halaman_informasi 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "All can view published halaman informasi" 
ON public.halaman_informasi 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Admin can manage surat field mapping" 
ON public.surat_field_mapping 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "All authenticated users can view field mapping" 
ON public.surat_field_mapping 
FOR SELECT 
USING (auth.uid() IS NOT NULL);