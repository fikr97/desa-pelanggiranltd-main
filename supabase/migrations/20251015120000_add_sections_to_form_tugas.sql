-- Tambahkan tabel untuk menyimpan section-section dalam form tugas
CREATE TABLE form_tugas_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_tugas_id UUID NOT NULL REFERENCES form_tugas(id) ON DELETE CASCADE,
    nama_section TEXT NOT NULL,
    deskripsi_section TEXT,
    urutan INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tambahkan komentar untuk tabel section
COMMENT ON TABLE form_tugas_sections IS 'Menyimpan section-section dalam formulir tugas untuk mengorganisir field-field.';

-- Tambahkan kolom section_id ke tabel form_tugas_fields
ALTER TABLE form_tugas_fields 
ADD COLUMN section_id UUID REFERENCES form_tugas_sections(id) ON DELETE SET NULL;

-- Tambahkan indeks untuk performansi
CREATE INDEX idx_form_tugas_sections_form_id ON form_tugas_sections(form_tugas_id);
CREATE INDEX idx_form_tugas_fields_section_id ON form_tugas_fields(section_id);

-- Update komentar untuk kolom section_id
COMMENT ON COLUMN form_tugas_fields.section_id IS 'ID section tempat field ini berada (jika ada).';

-- Aktifkan Row Level Security untuk tabel sections
ALTER TABLE form_tugas_sections ENABLE ROW LEVEL SECURITY;

-- Buat kebijakan RLS untuk tabel sections
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