ALTER TABLE public.form_tugas_fields
ADD COLUMN text_format TEXT DEFAULT 'normal';

COMMENT ON COLUMN public.form_tugas_fields.text_format IS 'Menentukan format teks (normal, uppercase, lowercase, capitalize) untuk field isian.';
