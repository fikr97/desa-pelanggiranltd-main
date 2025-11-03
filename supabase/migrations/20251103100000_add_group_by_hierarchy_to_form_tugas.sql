-- Add group_by_hierarchy column to store nested grouping configuration
ALTER TABLE public.form_tugas
ADD COLUMN group_by_hierarchy JSONB DEFAULT '[]';

COMMENT ON COLUMN public.form_tugas.group_by_hierarchy IS 'Array of field names for nested grouping hierarchy. Allows hierarchical grouping of data in nested levels.';