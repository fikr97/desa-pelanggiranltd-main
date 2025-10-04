
-- Delete all old and incorrect permissions for Form Tugas
DELETE FROM public.role_permissions
WHERE role = 'kadus' AND (
  permission LIKE 'form:tugas:%%' OR
  permission = 'sidebar:view:form_tugas'
);

-- Insert the correct and unified permissions for Form Tugas
INSERT INTO public.role_permissions (role, permission, description, is_enabled)
VALUES
    ('kadus', 'form_tugas:view', 'Melihat Form Tugas', false),
    ('kadus', 'form_tugas:create', 'Buat Form Tugas', false),
    ('kadus', 'form_tugas:fill', 'Isi Data Form Tugas', false),
    ('kadus', 'form_tugas:edit', 'Edit Form Tugas', false),
    ('kadus', 'form_tugas:delete', 'Hapus Form Tugas', false)
ON CONFLICT (role, permission) DO NOTHING;
