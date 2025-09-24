-- Add deck display fields to the form_tugas table as JSONB and remove redundant columns from form_tugas_fields
-- We'll keep the deck display fields in the main form_tugas table as a JSONB array

-- The display_type column and deck_display_fields JSONB column were already added in the previous migration
-- Now we'll ensure the form_tugas_fields doesn't have redundant deck configuration columns

-- We need to migrate existing deck configuration from individual fields to the JSONB array in form_tugas
-- This would be handled through application logic, not a direct SQL migration