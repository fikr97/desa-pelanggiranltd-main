-- MIGRASI: Hapus kolom section dari form_tugas_fields

-- Hapus kolom section dari tabel form_tugas_fields
ALTER TABLE form_tugas_fields 
DROP COLUMN IF EXISTS section_id,
DROP COLUMN IF EXISTS section_name,
DROP COLUMN IF EXISTS section_order;

-- Hapus indeks yang terkait dengan section jika ada
DROP INDEX IF EXISTS idx_form_tugas_fields_section_id;