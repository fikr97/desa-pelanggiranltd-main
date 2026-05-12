-- Migration: Fix broken policies and functions after role migration
-- Date: 2026-05-12
-- Description: 
--   1. Remove dangerous "Admin can delete profiles" policy (qual=true allowed anyone to delete)
--   2. Remove broken "Allow users to update their own profile" policy (used auth.uid()=id but id!=user_id)
--   3. Fix notify_admins and notify_relevant_users functions (referenced non-existent 'title' column)
--   4. Add missing admin management policies for galeri, halaman_informasi, konten_website
--   5. Add audit_log read policy for admins

-- 1. Remove dangerous/broken policies
DROP POLICY IF EXISTS "Admin can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;

-- 2. Fix notify_admins function (3-arg version)
CREATE OR REPLACE FUNCTION notify_admins(p_message TEXT, p_link TEXT, p_actor_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notifications (user_id, message, link, actor_id)
  SELECT user_id, p_message, p_link, p_actor_id
  FROM profiles
  WHERE role IN ('superuser', 'administrator') AND user_id != p_actor_id;
END;
$$;

-- 3. Fix notify_admins trigger function
CREATE OR REPLACE FUNCTION notify_admins()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notifications (user_id, message, link)
  SELECT user_id, TG_ARGV[0], TG_ARGV[1]
  FROM profiles
  WHERE role IN ('superuser', 'administrator');
  RETURN NEW;
END;
$$;

-- 4. Fix notify_relevant_users (3-arg version)
CREATE OR REPLACE FUNCTION notify_relevant_users(p_message TEXT, p_link TEXT, p_actor_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notifications (user_id, message, link, actor_id)
  SELECT user_id, p_message, p_link, p_actor_id
  FROM profiles
  WHERE role IN ('superuser', 'administrator') AND user_id != p_actor_id;
END;
$$;

-- 5. Fix notify_relevant_users trigger function
CREATE OR REPLACE FUNCTION notify_relevant_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notifications (user_id, message, link)
  SELECT user_id, TG_ARGV[0], TG_ARGV[1]
  FROM profiles
  WHERE role IN ('superuser', 'administrator');
  RETURN NEW;
END;
$$;

-- 6. Add admin management policies for content tables
CREATE POLICY "Admin can manage galeri" ON galeri FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin can view all galeri" ON galeri FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admin can manage halaman_informasi" ON halaman_informasi FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin can view all halaman_informasi" ON halaman_informasi FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admin can manage konten_website" ON konten_website FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admin can view all konten_website" ON konten_website FOR SELECT
USING (is_admin(auth.uid()));

-- 7. Add audit_log read policy for admins
CREATE POLICY "Admin can view audit_log" ON audit_log FOR SELECT
USING (is_admin(auth.uid()));
