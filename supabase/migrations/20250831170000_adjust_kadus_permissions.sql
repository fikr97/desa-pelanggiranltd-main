-- Add user_id column to form_tugas_data
ALTER TABLE public.form_tugas_data
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Drop existing policies for surat_template
DROP POLICY IF EXISTS "Allow authenticated users to view templates" ON public.surat_template;
DROP POLICY IF EXISTS "Allow authenticated users to create templates" ON public.surat_template;
DROP POLICY IF EXISTS "Allow authenticated users to update templates" ON public.surat_template;
DROP POLICY IF EXISTS "Allow admin to create templates" ON public.surat_template;
DROP POLICY IF EXISTS "Allow admin to update templates" ON public.surat_template;
DROP POLICY IF EXISTS "Allow admin to delete templates" ON public.surat_template;

-- RLS for surat_template
ALTER TABLE public.surat_template ENABLE ROW LEVEL SECURITY;
-- Allow all authenticated users to view templates
CREATE POLICY "Allow authenticated users to view templates"
ON public.surat_template FOR SELECT TO authenticated USING (true);
-- Allow only admin to create templates
CREATE POLICY "Allow admin to create templates"
ON public.surat_template FOR INSERT TO authenticated WITH CHECK ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');
-- Allow only admin to update templates
CREATE POLICY "Allow admin to update templates"
ON public.surat_template FOR UPDATE TO authenticated USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');
-- Allow only admin to delete templates
CREATE POLICY "Allow admin to delete templates"
ON public.surat_template FOR DELETE TO authenticated USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');


-- Drop existing policies for surat_field_mapping
DROP POLICY IF EXISTS "Allow authenticated users to view field mappings" ON public.surat_field_mapping;
DROP POLICY IF EXISTS "Allow authenticated users to insert field mappings" ON public.surat_field_mapping;
DROP POLICY IF EXISTS "Allow authenticated users to delete field mappings" ON public.surat_field_mapping;
DROP POLICY IF EXISTS "Allow authenticated users to update field mappings" ON public.surat_field_mapping;
DROP POLICY IF EXISTS "Allow admin to create field mappings" ON public.surat_field_mapping;
DROP POLICY IF EXISTS "Allow admin to update field mappings" ON public.surat_field_mapping;
DROP POLICY IF EXISTS "Allow admin to delete field mappings" ON public.surat_field_mapping;

-- RLS for surat_field_mapping
ALTER TABLE public.surat_field_mapping ENABLE ROW LEVEL SECURITY;
-- Allow all authenticated users to view mappings
CREATE POLICY "Allow authenticated users to view field mappings"
ON public.surat_field_mapping FOR SELECT TO authenticated USING (true);
-- Allow only admin to manage mappings
CREATE POLICY "Allow admin to manage field mappings"
ON public.surat_field_mapping FOR ALL TO authenticated USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');


-- Drop existing policies for form_tugas
DROP POLICY IF EXISTS "Admin can manage form_tugas" ON public.form_tugas;
DROP POLICY IF EXISTS "Allow authenticated to view form_tugas" ON public.form_tugas;
DROP POLICY IF EXISTS "Allow admin to manage form_tugas" ON public.form_tugas;

-- RLS for form_tugas
ALTER TABLE public.form_tugas ENABLE ROW LEVEL SECURITY;
-- Allow all authenticated users to view forms
CREATE POLICY "Allow authenticated to view form_tugas"
ON public.form_tugas FOR SELECT TO authenticated USING (true);
-- Allow only admin to create/update/delete forms
CREATE POLICY "Allow admin to manage form_tugas"
ON public.form_tugas FOR ALL TO authenticated USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');


-- Drop existing policies for form_tugas_fields
DROP POLICY IF EXISTS "Admin can manage form_tugas_fields" ON public.form_tugas_fields;
DROP POLICY IF EXISTS "Allow authenticated to view form_tugas_fields" ON public.form_tugas_fields;
DROP POLICY IF EXISTS "Allow admin to manage form_tugas_fields" ON public.form_tugas_fields;

-- RLS for form_tugas_fields
ALTER TABLE public.form_tugas_fields ENABLE ROW LEVEL SECURITY;
-- Allow all authenticated users to view form fields
CREATE POLICY "Allow authenticated to view form_tugas_fields"
ON public.form_tugas_fields FOR SELECT TO authenticated USING (true);
-- Allow only admin to create/update/delete form fields
CREATE POLICY "Allow admin to manage form_tugas_fields"
ON public.form_tugas_fields FOR ALL TO authenticated USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin') WITH CHECK ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');


-- Drop existing policies for form_tugas_data
DROP POLICY IF EXISTS "Admin can manage all data" ON public.form_tugas_data;
DROP POLICY IF EXISTS "Allow users to view their own form data" ON public.form_tugas_data;
DROP POLICY IF EXISTS "Allow admin to view all form data" ON public.form_tugas_data;
DROP POLICY IF EXISTS "Allow authenticated to insert form data" ON public.form_tugas_data;
DROP POLICY IF EXISTS "Allow users to update their own form data" ON public.form_tugas_data;
DROP POLICY IF EXISTS "Allow admin to delete form data" ON public.form_tugas_data;

-- RLS for form_tugas_data
ALTER TABLE public.form_tugas_data ENABLE ROW LEVEL SECURITY;
-- Allow users to view their own data, and admins to view all data
CREATE POLICY "Allow users to view their own form data, and admin to view all"
ON public.form_tugas_data FOR SELECT TO authenticated USING (user_id = auth.uid() OR (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');
-- Allow authenticated users to insert data for themselves
CREATE POLICY "Allow authenticated to insert form data"
ON public.form_tugas_data FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
-- Allow users to update their own data
CREATE POLICY "Allow users to update their own form data"
ON public.form_tugas_data FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
-- Allow admin to delete any data
CREATE POLICY "Allow admin to delete form data"
ON public.form_tugas_data FOR DELETE TO authenticated USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');
