-- Fix surat table RLS policy and create proper trigger function
-- This migration creates the missing handle_surat_creation function and fixes RLS policies

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

-- Now fix the RLS policies for surat table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can create surat" ON public.surat;
DROP POLICY IF EXISTS "Users can view and manage their surat" ON public.surat;

-- Create new policy for INSERT - allow authenticated users to create surat
-- The trigger will handle setting the created_by field
CREATE POLICY "Users can create surat" 
ON public.surat 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create new policy for SELECT, UPDATE, DELETE - allow users to manage their own surat or admin
CREATE POLICY "Users can view and manage their surat" 
ON public.surat 
FOR ALL 
TO authenticated 
USING (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR 
    created_by = auth.uid()::text
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR 
    created_by = auth.uid()::text
  )
);

-- Ensure RLS is enabled on the surat table
ALTER TABLE public.surat ENABLE ROW LEVEL SECURITY;

-- For existing records that might not have created_by set, update them to have the proper value
-- This will set created_by to a default value where it's NULL
-- Note: This is just for existing records without proper created_by
-- UPDATE public.surat SET created_by = 'migrated-record' WHERE created_by IS NULL;