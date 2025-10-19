-- MIGRASI PERBAIKAN: Tambahkan unique constraint untuk form_tugas_sections dan perbarui section untuk existing fields

-- 1. Tambahkan unique constraint pada tabel form_tugas_sections
ALTER TABLE form_tugas_sections 
ADD CONSTRAINT unique_form_section UNIQUE (form_tugas_id, name);

-- 2. Insert sections for existing forms if they don't exist
INSERT INTO form_tugas_sections (form_tugas_id, name, description, order_number)
SELECT DISTINCT fft.form_tugas_id, 'Umum', 'Section umum untuk field-field tanpa kategori', 0
FROM form_tugas_fields fft
WHERE NOT EXISTS (
    SELECT 1 FROM form_tugas_sections fts 
    WHERE fts.form_tugas_id = fft.form_tugas_id AND fts.name = 'Umum'
);

-- 3. Update existing fields to assign them to appropriate sections
UPDATE form_tugas_fields 
SET 
    section_name = COALESCE(section_name, 'Umum'),
    section_order = COALESCE(section_order, 0)
WHERE 
    section_id IS NULL 
    AND (section_name IS NULL OR section_name = 'Umum');