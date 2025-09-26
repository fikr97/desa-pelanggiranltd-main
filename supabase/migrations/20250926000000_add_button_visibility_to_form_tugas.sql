-- Add button visibility settings to form_tugas table
-- This allows controlling visibility of Add, Edit, and Delete buttons in the form data view

ALTER TABLE public.form_tugas 
ADD COLUMN IF NOT EXISTS show_add_button BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_edit_button BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS show_delete_button BOOLEAN DEFAULT TRUE;

-- Add comments to document the new columns
COMMENT ON COLUMN public.form_tugas.show_add_button IS 'Menentukan apakah tombol tambah data ditampilkan atau tidak';
COMMENT ON COLUMN public.form_tugas.show_edit_button IS 'Menentukan apakah tombol edit data ditampilkan atau tidak';
COMMENT ON COLUMN public.form_tugas.show_delete_button IS 'Menentukan apakah tombol hapus data ditampilkan atau tidak';