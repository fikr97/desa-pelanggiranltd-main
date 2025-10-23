ALTER TABLE public.form_tugas_fields
ADD COLUMN is_editable BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.form_tugas_fields.is_editable IS 'Menandakan apakah field ini dapat diedit di form isian data.';
