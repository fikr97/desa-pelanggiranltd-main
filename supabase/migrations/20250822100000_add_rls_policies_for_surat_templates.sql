-- This migration adds Row Level Security (RLS) policies to the surat_template 
-- and surat_field_mapping tables. These policies are necessary to allow 
-- authenticated users to manage letter templates from the web application.

-- Enable RLS for surat_template table
ALTER TABLE public.surat_template ENABLE ROW LEVEL SECURITY;

-- Policies for surat_template
-- Allow authenticated users to view all templates
CREATE POLICY "Allow authenticated users to view templates"
ON public.surat_template
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to create new templates
CREATE POLICY "Allow authenticated users to create templates"
ON public.surat_template
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update any template
CREATE POLICY "Allow authenticated users to update templates"
ON public.surat_template
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Enable RLS for surat_field_mapping table
ALTER TABLE public.surat_field_mapping ENABLE ROW LEVEL SECURITY;

-- Policies for surat_field_mapping
-- Allow authenticated users to view all field mappings
CREATE POLICY "Allow authenticated users to view field mappings"
ON public.surat_field_mapping
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert new field mappings
CREATE POLICY "Allow authenticated users to insert field mappings"
ON public.surat_field_mapping
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to delete field mappings
-- This is needed because the app deletes old placeholders before saving new ones.
CREATE POLICY "Allow authenticated users to delete field mappings"
ON public.surat_field_mapping
FOR DELETE
TO authenticated
USING (true);

