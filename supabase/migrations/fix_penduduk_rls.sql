-- This script fixes the Row Level Security (RLS) policies for the 'penduduk' table
-- to allow 'kadus' (hamlet head) to update a resident's 'dusun' (hamlet).

-- 1. Drop existing policies to ensure a clean slate.
DROP POLICY IF EXISTS "penduduk_select_policy" ON public.penduduk;
DROP POLICY IF EXISTS "penduduk_insert_policy" ON public.penduduk;
DROP POLICY IF EXISTS "penduduk_update_policy" ON public.penduduk;
DROP POLICY IF EXISTS "penduduk_delete_policy" ON public.penduduk;

-- 2. Create or replace helper functions to get the current user's role and dusun.
-- Using functions in policies can be more efficient and easier to read.
-- The SECURITY DEFINER clause is important for these functions to work within RLS policies.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
BEGIN
  -- In case the profile doesn't exist yet for a new user, return an empty string.
  RETURN (SELECT role FROM public.profiles WHERE user_id = auth.uid());
EXCEPTION
  WHEN OTHERS THEN
    RETURN '';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_dusun()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT dusun FROM public.profiles WHERE user_id = auth.uid());
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Recreate policies using the helper functions.

-- SELECT Policy: Admins can see everyone. Kadus can only see residents in their own dusun.
CREATE POLICY "penduduk_select_policy" ON public.penduduk
FOR SELECT USING (
    get_my_role() = 'admin'
    OR (get_my_role() = 'kadus' AND get_my_dusun() = penduduk.dusun)
);

-- INSERT Policy: Admins can add residents to any dusun. Kadus can only add residents to their own dusun.
CREATE POLICY "penduduk_insert_policy" ON public.penduduk
FOR INSERT WITH CHECK (
    get_my_role() = 'admin'
    OR (get_my_role() = 'kadus' AND get_my_dusun() = penduduk.dusun)
);

-- DELETE Policy: Admins can delete any resident. Kadus can only delete residents from their own dusun.
CREATE POLICY "penduduk_delete_policy" ON public.penduduk
FOR DELETE USING (
    get_my_role() = 'admin'
    OR (get_my_role() = 'kadus' AND get_my_dusun() = penduduk.dusun)
);

-- UPDATE Policy (The Fix):
-- USING clause defines which rows can be selected for an update.
-- WITH CHECK clause defines what the new, updated row must look like.
CREATE POLICY "penduduk_update_policy" ON public.penduduk
FOR UPDATE
USING (
    -- An admin can start an update on any resident.
    -- A kadus can only start an update on a resident currently in their dusun.
    get_my_role() = 'admin'
    OR (get_my_role() = 'kadus' AND get_my_dusun() = penduduk.dusun)
)
WITH CHECK (
    -- An admin can change the resident's data to anything.
    -- A kadus, having been authorized by the USING clause, is also permitted to save the changes.
    -- This check does not restrict the new 'dusun' value, thus allowing the kadus to move the resident.
    get_my_role() IN ('admin', 'kadus')
);

