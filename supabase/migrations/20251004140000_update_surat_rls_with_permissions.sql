-- Fix surat table RLS policy using the new permission system
-- This migration creates the missing handle_surat_creation function and updates RLS policies to use the new permission system

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS surat_creation_trigger ON public.surat;

-- Create or replace the function to handle surat creation
-- This function will set the created_by field to the current user's ID
CREATE OR REPLACE FUNCTION public.handle_surat_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set the created_by field to the current authenticated user's ID
  NEW.created_by := auth.uid()::text;
  RETURN NEW;
END;
$$;

-- Create the trigger to automatically set created_by on INSERT
CREATE TRIGGER surat_creation_trigger
  BEFORE INSERT ON public.surat
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_surat_creation();

-- Update the RLS policies for surat table to use the new permission system
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create surat" ON public.surat;
DROP POLICY IF EXISTS "Users can view and manage their surat" ON public.surat;

-- Create new policy for INSERT using the new permission system
CREATE POLICY "Surat Insert Policy" 
ON public.surat 
FOR INSERT 
TO authenticated
WITH CHECK (public.has_permission('button:create:surat'));

-- Create new policy for SELECT, UPDATE, DELETE using the new permission system
-- For UPDATE and DELETE, ensure users can only edit/delete their own surat unless they have admin permissions
CREATE POLICY "Surat Select Policy" 
ON public.surat 
FOR SELECT
TO authenticated
USING (
  public.has_permission('sidebar:view:surat')
  AND (
    public.is_admin(auth.uid())  -- Admin can view all
    OR created_by = auth.uid()::text  -- Regular users can only view their own
  )
);

CREATE POLICY "Surat Update Policy" 
ON public.surat 
FOR UPDATE
TO authenticated
USING (
  public.has_permission('button:edit:surat')
  AND (
    public.is_admin(auth.uid())  -- Admin can update all
    OR created_by = auth.uid()::text  -- Regular users can only update their own
  )
)
WITH CHECK (
  public.has_permission('button:edit:surat')
  AND (
    public.is_admin(auth.uid())  -- Admin can update all
    OR created_by = auth.uid()::text  -- Regular users can only update their own
  )
);

CREATE POLICY "Surat Delete Policy" 
ON public.surat 
FOR DELETE
TO authenticated
USING (
  public.has_permission('button:delete:surat')
  AND (
    public.is_admin(auth.uid())  -- Admin can delete all
    OR created_by = auth.uid()::text  -- Regular users can only delete their own
  )
);

-- Ensure RLS is enabled on the surat table
ALTER TABLE public.surat ENABLE ROW LEVEL SECURITY;