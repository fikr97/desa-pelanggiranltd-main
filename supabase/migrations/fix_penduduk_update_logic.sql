-- This script creates a secure function to move residents and adjusts RLS policies.

-- 1. First, ensure the helper functions from the previous attempt exist.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
BEGIN
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

-- 2. Create the SECURITY DEFINER function to handle moving a resident.
-- This function runs with the privileges of the definer, bypassing the caller's RLS.
CREATE OR REPLACE FUNCTION move_penduduk(resident_id UUID, new_dusun TEXT)
RETURNS VOID AS $$
DECLARE
  caller_role TEXT;
  caller_dusun TEXT;
  resident_current_dusun TEXT;
BEGIN
  -- Get the role and dusun of the user calling this function.
  caller_role := get_my_role();
  caller_dusun := get_my_dusun();

  -- Get the current dusun of the resident being moved.
  SELECT dusun INTO resident_current_dusun FROM public.penduduk WHERE id = resident_id;

  -- SECURITY CHECK: Only allow admins or the correct Kadus to perform the move.
  IF caller_role = 'admin' OR (caller_role = 'kadus' AND caller_dusun = resident_current_dusun) THEN
    -- If the check passes, perform the update, bypassing RLS because of SECURITY DEFINER.
    UPDATE public.penduduk
    SET dusun = new_dusun
    WHERE id = resident_id;
  ELSE
    -- If the check fails, raise an exception.
    RAISE EXCEPTION 'User does not have permission to move this resident.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Drop and recreate the UPDATE policy with a stricter WITH CHECK clause.
DROP POLICY IF EXISTS "penduduk_update_policy" ON public.penduduk;

CREATE POLICY "penduduk_update_policy" ON public.penduduk
FOR UPDATE
USING (
    -- A kadus can only select residents from their own dusun to edit.
    get_my_role() = 'admin'
    OR (get_my_role() = 'kadus' AND get_my_dusun() = penduduk.dusun)
)
WITH CHECK (
    -- An admin can change anything.
    -- A kadus can update a row ONLY IF they are NOT changing the dusun value.
    -- This forces dusun changes to go through the move_penduduk() function.
    get_my_role() = 'admin'
    OR (get_my_role() = 'kadus' AND get_my_dusun() = penduduk.dusun)
);

-- Note: Other policies (SELECT, INSERT, DELETE) do not need to be changed.
