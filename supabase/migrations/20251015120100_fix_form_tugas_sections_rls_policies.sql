-- Perbaikan kebijakan RLS untuk tabel form_tugas_sections
-- File ini memperbarui kebijakan RLS agar konsisten dengan sistem form_tugas yang sudah ada

-- Hapus kebijakan lama
DROP POLICY IF EXISTS "Admin can manage form_tugas_sections" ON form_tugas_sections;
DROP POLICY IF EXISTS "Authenticated users can view form_tugas_sections" ON form_tugas_sections;

-- Buat kebijakan RLS yang diperbarui untuk tabel sections
CREATE POLICY "Allow admin to manage form_tugas_sections" ON form_tugas_sections
FOR ALL
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);

CREATE POLICY "Allow authenticated users to view form_tugas_sections" ON form_tugas_sections
FOR SELECT
TO authenticated
USING (auth.role() = 'authenticated');