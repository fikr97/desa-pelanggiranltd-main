-- MIGRASI: Tambahkan dukungan section ke form_tugas_fields
-- Tujuan: Memungkinkan pengelompokan field-field dalam section untuk form tugas

-- 1. Tambahkan kolom untuk section ke tabel form_tugas_fields
ALTER TABLE form_tugas_fields 
ADD COLUMN IF NOT EXISTS section_id UUID,
ADD COLUMN IF NOT EXISTS section_name TEXT DEFAULT 'Umum',
ADD COLUMN IF NOT EXISTS section_order INT DEFAULT 0;

-- 2. Buat tabel sections untuk menyimpan definisi section
CREATE TABLE IF NOT EXISTS form_tugas_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_tugas_id UUID NOT NULL REFERENCES form_tugas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    order_number INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create sections for existing forms and assign existing fields to a default section
DO $
DECLARE
    form_record RECORD;
    section_id_var UUID;
BEGIN
    -- For each existing form, create a default 'Umum' section and assign all its fields to it
    FOR form_record IN SELECT DISTINCT form_tugas_id FROM form_tugas_fields
    LOOP
        -- Create or get a default section for this form
        INSERT INTO form_tugas_sections (form_tugas_id, name, description, order_number)
        VALUES (form_record.form_tugas_id, 'Umum', 'Section umum untuk field-field tanpa kategori', 0)
        ON CONFLICT (form_tugas_id, name) DO NOTHING;
        
        -- Get the section ID for the 'Umum' section
        SELECT id INTO section_id_var FROM form_tugas_sections 
        WHERE form_tugas_id = form_record.form_tugas_id AND name = 'Umum' 
        ORDER BY created_at LIMIT 1;
        
        -- Assign fields that don't have a section to this default section
        UPDATE form_tugas_fields 
        SET section_id = section_id_var,
            section_name = 'Umum'
        WHERE form_tugas_id = form_record.form_tugas_id 
          AND section_id IS NULL 
          AND (section_name IS NULL OR section_name = 'Umum');
    END LOOP;
END $;

-- 3. Tambahkan indeks untuk performa
CREATE INDEX IF NOT EXISTS idx_form_tugas_fields_section_id ON form_tugas_fields(section_id);
CREATE INDEX IF NOT EXISTS idx_form_tugas_fields_form_tugas_id ON form_tugas_fields(form_tugas_id);
CREATE INDEX IF NOT EXISTS idx_form_tugas_sections_form_id ON form_tugas_sections(form_tugas_id);

-- 4. Tambahkan komentar untuk dokumentasi
COMMENT ON COLUMN form_tugas_fields.section_id IS 'Referensi ke section tempat field ini berada';
COMMENT ON COLUMN form_tugas_fields.section_name IS 'Nama section untuk field ini (jika tidak menggunakan referensi ke tabel sections)';
COMMENT ON COLUMN form_tugas_fields.section_order IS 'Urutan section jika menggunakan section_name';

COMMENT ON TABLE form_tugas_sections IS 'Menyimpan definisi section untuk form tugas, memungkinkan pengelompokan field dalam section';

-- 5. Buat kebijakan RLS untuk tabel sections
ALTER TABLE form_tugas_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage form_tugas_sections" ON form_tugas_sections
FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);

CREATE POLICY "Authenticated users can view form_tugas_sections" ON form_tugas_sections
FOR SELECT
USING (auth.role() = 'authenticated');

-- 6. Update RLS untuk form_tugas_fields untuk mendukung akses ke kolom section
DROP POLICY IF EXISTS "Admin can manage form_tugas_fields" ON form_tugas_fields;
CREATE POLICY "Admin can manage form_tugas_fields" ON form_tugas_fields
FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);

DROP POLICY IF EXISTS "Authenticated users can view form_tugas_fields" ON form_tugas_fields;
CREATE POLICY "Authenticated users can view form_tugas_fields" ON form_tugas_fields
FOR SELECT
USING (auth.role() = 'authenticated');
