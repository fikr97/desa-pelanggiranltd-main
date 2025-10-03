-- This migration creates helper functions for checking user roles and permissions.

-- Function to get the role of the currently authenticated user from the profiles table.
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE user_id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user is an admin.
-- This is a dependency for policies in the first migration file.
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = p_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to check if the current user has a specific permission.
CREATE OR REPLACE FUNCTION public.has_permission(p_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Get the role of the current user.
  v_role := public.get_user_role();

  -- Admins have all permissions, bypassing the check.
  IF v_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  -- For other roles, check the role_permissions table.
  RETURN EXISTS (
    SELECT 1
    FROM public.role_permissions
    WHERE role_permissions.role = v_role
      AND role_permissions.permission = p_permission
      AND role_permissions.is_enabled = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
