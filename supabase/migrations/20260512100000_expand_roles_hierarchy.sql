-- Migration: Expand role system from 2 roles (admin, kadus) to 6 roles
-- New hierarchy: superuser > administrator > kades > sekretaris_desa > kaur_kasi > kadus
-- ALREADY EXECUTED ON REMOTE via supabase db query --linked

-- 1. Drop old constraint and add new one
ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
UPDATE public.profiles SET role = 'superuser' WHERE role = 'admin';
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('superuser', 'administrator', 'kades', 'sekretaris_desa', 'kaur_kasi', 'kadus'));

-- 2. Update is_admin to recognize superuser and administrator
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = p_user_id
    AND role IN ('superuser', 'administrator')
  );
END;
$$;

-- 3. Create is_superuser helper
CREATE OR REPLACE FUNCTION public.is_superuser(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = p_user_id
    AND role = 'superuser'
  );
END;
$$;

-- 4. Update RLS on role_permissions: only superuser can manage
DROP POLICY IF EXISTS "Allow full access to admins" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow full access to superuser" ON public.role_permissions;
CREATE POLICY "Allow full access to superuser"
ON public.role_permissions
FOR ALL
USING (public.is_superuser(auth.uid()))
WITH CHECK (public.is_superuser(auth.uid()));

-- 5. Insert permissions for new roles (copy from kadus, all disabled)
INSERT INTO public.role_permissions (role, permission, description, is_enabled)
SELECT r.role, p.permission, p.description, false
FROM (VALUES ('administrator'), ('kades'), ('sekretaris_desa'), ('kaur_kasi')) AS r(role)
CROSS JOIN (
  SELECT DISTINCT permission, description FROM public.role_permissions WHERE role = 'kadus'
) p
ON CONFLICT (role, permission) DO NOTHING;

-- 6. Add user management permissions
INSERT INTO public.role_permissions (role, permission, description, is_enabled)
VALUES
  ('administrator', 'sidebar:view:manajemen_user', 'Melihat menu Manajemen User di sidebar', false),
  ('administrator', 'button:manage:permissions', 'Akses untuk mengelola hak akses', false),
  ('kades', 'sidebar:view:manajemen_user', 'Melihat menu Manajemen User di sidebar', false),
  ('kades', 'button:manage:permissions', 'Akses untuk mengelola hak akses', false),
  ('sekretaris_desa', 'sidebar:view:manajemen_user', 'Melihat menu Manajemen User di sidebar', false),
  ('sekretaris_desa', 'button:manage:permissions', 'Akses untuk mengelola hak akses', false),
  ('kaur_kasi', 'sidebar:view:manajemen_user', 'Melihat menu Manajemen User di sidebar', false),
  ('kaur_kasi', 'button:manage:permissions', 'Akses untuk mengelola hak akses', false),
  ('kadus', 'sidebar:view:manajemen_user', 'Melihat menu Manajemen User di sidebar', false),
  ('kadus', 'button:manage:permissions', 'Akses untuk mengelola hak akses', false)
ON CONFLICT (role, permission) DO NOTHING;

-- 7. Cleanup old admin permissions
DELETE FROM role_permissions WHERE role = 'admin';
