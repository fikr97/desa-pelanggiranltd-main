ALTER TABLE public.form_tugas
ADD COLUMN default_group_by TEXT;

COMMENT ON COLUMN public.form_tugas.default_group_by IS 'Field default untuk pengelompokan data.';
