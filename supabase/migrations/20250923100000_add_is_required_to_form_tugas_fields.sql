ALTER TABLE public.form_tugas_fields
ADD COLUMN is_required BOOLEAN DEFAULT FALSE NOT NULL;

COMMENT ON COLUMN public.form_tugas_fields.is_required IS 'Menandakan apakah field ini wajib diisi atau tidak.';