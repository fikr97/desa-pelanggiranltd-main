-- Tambah kolom `dependency` ke form_tugas_fields untuk mendukung field dependencies (conditional visibility)
-- Format JSON:
-- {
--   "field": "status_kawin",      -- nama_field yang menjadi pemicu
--   "operator": "equals",          -- equals | not_equals | in | not_in
--   "value": "Menikah" | ["A","B"] -- nilai yang cocok
-- }

ALTER TABLE form_tugas_fields
ADD COLUMN IF NOT EXISTS dependency JSONB;

COMMENT ON COLUMN form_tugas_fields.dependency IS 'Konfigurasi conditional visibility field. Jika di-set, field hanya tampil ketika kondisi terpenuhi. Contoh: {"field":"status_kawin","operator":"equals","value":"Menikah"}';
