-- Perbarui kebijakan RLS untuk tabel form_tugas_sections agar konsisten dengan form_tugas dan form_tugas_fields
-- Hapus kebijakan lama
DROP POLICY IF EXISTS "Admin can manage form_tugas_sections" ON public.form_tugas_sections;
DROP POLICY IF EXISTS "Authenticated users can view form_tugas_sections" ON public.form_tugas_sections;
DROP POLICY IF EXISTS "Allow admin to manage form_tugas_sections" ON public.form_tugas_sections;
DROP POLICY IF EXISTS "Allow authenticated to view form_tugas_sections" ON public.form_tugas_sections;

-- Buat kebijakan untuk admin: bisa mengelola semua sections
CREATE POLICY "Admin can manage form_tugas_sections"
ON public.form_tugas_sections FOR ALL TO authenticated
USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- Berikan akses SELECT ke semua user terotentikasi (konsisten dengan form_tugas_fields)
CREATE POLICY "Authenticated users can view form_tugas_sections"
ON public.form_tugas_sections FOR SELECT TO authenticated
USING (true);