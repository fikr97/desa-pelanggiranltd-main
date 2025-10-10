-- MIGRASI: Hapus Kolom Visibilitas Formulir dari Tabel form_tugas

-- Hapus fungsi-fungsi terkait jika ada
DROP FUNCTION IF EXISTS get_residents_for_form(uuid);

-- Hapus semua kebijakan RLS yang ada terkait dengan visibilitas
-- Langkah pertama: Hapus semua kebijakan terkait visibilitas
DROP POLICY IF EXISTS "Allow authenticated to view form_tugas based on visibility" ON form_tugas;
DROP POLICY IF EXISTS "Allow all authenticated to view their own data and data from their dusun in accessible forms or all data mode" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to insert data for residents in their dusun to accessible forms or all data forms" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow users to update their own data or data from their dusun in accessible forms or all data forms" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow admin to delete form data" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow admin to manage form_tugas" ON form_tugas;

-- Hapus kebijakan tambahan yang teridentifikasi dari error
DROP POLICY IF EXISTS "Allow users to update form data properly in all contexts" ON form_tugas_data;
DROP POLICY IF EXISTS "Allow comprehensive data viewing for forms" ON form_tugas_data;
DROP POLICY IF EXISTS "Simple select policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Simple update policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Simple delete policy for form_tugas_data" ON form_tugas_data;
DROP POLICY IF EXISTS "Select policy for form_tugas based on visibility" ON form_tugas;
DROP POLICY IF EXISTS "Select policy for form_tugas_data based on form visibility" ON form_tugas_data;
DROP POLICY IF EXISTS "Insert policy for form_tugas_data based on form visibility" ON form_tugas_data;
DROP POLICY IF EXISTS "Update policy for form_tugas_data based on form visibility" ON form_tugas_data;
DROP POLICY IF EXISTS "Delete policy for form_tugas_data based on form visibility" ON form_tugas_data;
DROP POLICY IF EXISTS "Users can view forms based on visibility rules" ON form_tugas;

-- Hapus kebijakan tambahan terbaru dari error terbaru
DROP POLICY IF EXISTS "Select policy for form_tugas_data based on form visibility and" ON form_tugas_data;
DROP POLICY IF EXISTS "Insert policy for form_tugas_data based on form visibility and" ON form_tugas_data;
DROP POLICY IF EXISTS "Update policy for form_tugas_data based on form visibility and" ON form_tugas_data;
DROP POLICY IF EXISTS "Delete policy for form_tugas_data based on form visibility and" ON form_tugas_data;

-- Juga hapus kebijakan lama yang mungkin sudah ada sebelum fitur visibilitas
DROP POLICY IF EXISTS "Admin can manage form_tugas" ON form_tugas;
DROP POLICY IF EXISTS "Authenticated users can view form_tugas" ON form_tugas;
DROP POLICY IF EXISTS "Users can manage their own submitted data" ON form_tugas_data;
DROP POLICY IF EXISTS "Admin can manage all data" ON form_tugas_data;

-- Hapus constraint yang terkait dengan kolom visibilitas_dusun
ALTER TABLE form_tugas DROP CONSTRAINT IF EXISTS form_tugas_visibilitas_dusun_check;

-- Hapus komentar kolom terkait SEBELUM menghapus kolomnya
COMMENT ON COLUMN form_tugas.visibilitas_dusun IS NULL;
COMMENT ON COLUMN form_tugas.dusun_terpilih IS NULL;

-- Hapus kolom-kolom visibilitas dari tabel form_tugas
-- Gunakan CASCADE untuk menangani semua policy yang mungkin masih tersisa
ALTER TABLE form_tugas DROP COLUMN IF EXISTS visibilitas_dusun CASCADE;
ALTER TABLE form_tugas DROP COLUMN IF EXISTS dusun_terpilih CASCADE;
-- Hapus juga kolom-kolom duplikat yang terlihat dari schema
ALTER TABLE form_tugas DROP COLUMN IF EXISTS visibility CASCADE;
ALTER TABLE form_tugas DROP COLUMN IF EXISTS allowed_dusuns CASCADE;

-- Setelah semua kolom dan policy terkait dihapus, kembalikan kebijakan RLS dasar
-- Kebijakan untuk form_tugas: Admin dapat mengelola semua form tugas, pengguna terautentikasi dapat melihat
CREATE POLICY "Admin can manage form_tugas" ON form_tugas
FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Authenticated users can view form_tugas" ON form_tugas
FOR SELECT
USING (auth.role() = 'authenticated');

-- Kebijakan untuk form_tugas_data: Pengguna dapat mengelola data yang mereka kirimkan, admin dapat mengelola semua data
CREATE POLICY "Users can manage their own submitted data" ON form_tugas_data
FOR ALL
USING (auth.uid() = submitted_by)
WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY "Admin can manage all data" ON form_tugas_data
FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);