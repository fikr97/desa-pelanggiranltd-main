-- MIGRASI PERBAIKAN: Hapus tabel form_tugas_sections karena section info sudah diembed di form_tugas_fields

-- Hapus tabel form_tugas_sections karena kita hanya menggunakan field section di form_tugas_fields
DROP TABLE IF EXISTS form_tugas_sections CASCADE;

-- Pastikan section_name memiliki nilai default 'Umum'
ALTER TABLE form_tugas_fields 
ALTER COLUMN section_name SET DEFAULT 'Umum';

-- Update existing fields to assign them to appropriate sections
UPDATE form_tugas_fields 
SET 
    section_name = COALESCE(section_name, 'Umum'),
    section_order = COALESCE(section_order, 0)
WHERE 
    section_name IS NULL OR section_name = '';