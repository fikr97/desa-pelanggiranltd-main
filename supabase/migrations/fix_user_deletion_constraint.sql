-- This migration fixes foreign key constraints that prevent user deletion.
-- It alters tables that reference 'auth.users' to specify what happens when a user is deleted.

-- 1. Alter the 'form_tugas' table for the 'created_by' column.
-- We need to drop the existing constraint and add a new one with ON DELETE SET NULL.
-- First, find the constraint name. It's usually 'table_column_fkey'.
ALTER TABLE public.form_tugas
DROP CONSTRAINT IF EXISTS form_tugas_created_by_fkey, -- Default constraint name
ADD CONSTRAINT form_tugas_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- 2. Alter the 'form_tugas_data' table for the 'submitted_by' column.
-- Here, we want to delete the submission if the user is deleted.
ALTER TABLE public.form_tugas_data
DROP CONSTRAINT IF EXISTS form_tugas_data_submitted_by_fkey, -- Default constraint name
ADD CONSTRAINT form_tugas_data_submitted_by_fkey
  FOREIGN KEY (submitted_by)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- 3. Alter the 'form_tugas_data' table for the 'user_id' column.
-- This was added in a later migration. We also want to cascade deletes here.
ALTER TABLE public.form_tugas_data
DROP CONSTRAINT IF EXISTS form_tugas_data_user_id_fkey, -- Default constraint name
ADD CONSTRAINT form_tugas_data_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

