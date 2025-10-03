-- This migration updates RLS policies for the 'penduduk' table to use the new permission system.

-- It is often safer to drop and recreate policies than to alter them.

-- 1. Policy for SELECT
-- Allows users to see data if they have the 'sidebar:view:penduduk' permission.
DROP POLICY IF EXISTS "Allow select for authenticated users on penduduk" ON public.penduduk;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.penduduk; -- Common default name
DROP POLICY IF EXISTS "Penduduk Select" ON public.penduduk; -- A potential name
CREATE POLICY "Penduduk Select Policy"
ON public.penduduk
FOR SELECT
USING (public.has_permission('sidebar:view:penduduk'));

-- 2. Policy for INSERT
-- Allows users to insert data if they have the 'button:create:penduduk' permission.
DROP POLICY IF EXISTS "Allow insert for authenticated users on penduduk" ON public.penduduk;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.penduduk; -- Common default name
DROP POLICY IF EXISTS "Penduduk Insert" ON public.penduduk; -- A potential name
CREATE POLICY "Penduduk Insert Policy"
ON public.penduduk
FOR INSERT
WITH CHECK (public.has_permission('button:create:penduduk'));

-- 3. Policy for UPDATE
-- Allows users to update data if they have the 'button:edit:penduduk' permission.
DROP POLICY IF EXISTS "Allow update for users on penduduk" ON public.penduduk;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.penduduk; -- Common default name
DROP POLICY IF EXISTS "Penduduk Update" ON public.penduduk; -- A potential name
CREATE POLICY "Penduduk Update Policy"
ON public.penduduk
FOR UPDATE
USING (public.has_permission('button:edit:penduduk'))
WITH CHECK (public.has_permission('button:edit:penduduk'));

-- 4. Policy for DELETE
-- Allows users to delete data if they have the 'button:delete:penduduk' permission.
DROP POLICY IF EXISTS "Allow delete for users on penduduk" ON public.penduduk;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.penduduk; -- Common default name
DROP POLICY IF EXISTS "Penduduk Delete" ON public.penduduk; -- A potential name
CREATE POLICY "Penduduk Delete Policy"
ON public.penduduk
FOR DELETE
USING (public.has_permission('button:delete:penduduk'));

-- 5. Add profile management policies
-- Fix the profiles table policies to allow admin to view and manage all profiles
-- Drop the existing policies that were incorrectly defined
DROP POLICY IF EXISTS "Allow users to view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can delete profiles" ON public.profiles;

-- Users can view their own profile (correctly referencing user_id)
CREATE POLICY "Profiles Select - Users Own Data"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Profiles Update - Users Own Data"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin can view all profiles
CREATE POLICY "Profiles Select - Admin Access"
ON public.profiles
FOR SELECT
USING (public.has_permission('sidebar:view:manajemen_user'));

-- Admin can update all profiles
CREATE POLICY "Profiles Update - Admin Access"
ON public.profiles
FOR UPDATE
USING (public.has_permission('button:edit:manajemen_user'))
WITH CHECK (public.has_permission('button:edit:manajemen_user'));

-- Admin can insert profiles
CREATE POLICY "Profiles Insert - Admin Access"
ON public.profiles
FOR INSERT
WITH CHECK (public.has_permission('button:create:manajemen_user'));

-- Admin can delete profiles
CREATE POLICY "Profiles Delete - Admin Access"
ON public.profiles
FOR DELETE
USING (public.has_permission('button:delete:manajemen_user'));

-- Note: This process should be repeated for other tables like 'berita', 'surat_keluar', etc.,
-- with their corresponding permission strings.

-- 6. Add permissions management policy
-- Allows users to manage permissions if they have the 'button:manage:permissions' permission.
-- This is for the settings page to display the hak akses tab.
CREATE POLICY "Permission Manager Access Policy"
ON public.role_permissions
FOR ALL
USING (public.has_permission('button:manage:permissions'))
WITH CHECK (public.has_permission('button:manage:permissions'));
