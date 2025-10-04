
INSERT INTO public.role_permissions (role, permission, description, is_enabled)
VALUES
    ('kadus', 'form_tugas:view', 'Melihat Form Tugas', false),
    ('kadus', 'form_tugas:create', 'Buat Form Tugas', false),
    ('kadus', 'form_tugas:fill', 'Isi Data Form Tugas', false),
    ('kadus', 'form_tugas:edit', 'Edit Form Tugas', false),
    ('kadus', 'form_tugas:delete', 'Hapus Form Tugas', false)
ON CONFLICT (role, permission) DO NOTHING;
