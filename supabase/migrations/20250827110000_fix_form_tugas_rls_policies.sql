-- Hapus kebijakan yang salah yang dibuat sebelumnya
DROP POLICY "Admin can manage form_tugas" ON public.form_tugas;
DROP POLICY "Admin can manage form_tugas_fields" ON public.form_tugas_fields;
DROP POLICY "Admin can manage all data" ON public.form_tugas_data;

-- Buat ulang kebijakan dengan perbandingan kolom yang benar (user_id)
CREATE POLICY "Admin can manage form_tugas" ON public.form_tugas
FOR ALL
USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Admin can manage form_tugas_fields" ON public.form_tugas_fields
FOR ALL
USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');

CREATE POLICY "Admin can manage all data" ON public.form_tugas_data
FOR ALL
USING ((SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin');
