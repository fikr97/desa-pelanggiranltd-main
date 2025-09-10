-- Check if all required columns exist and have correct constraints
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'surat_field_mapping' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check for any foreign key constraints that might be causing issues
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'surat_field_mapping';

-- Check if there are any NOT NULL constraints on new columns that might cause issues
SELECT 
    column_name,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'surat_field_mapping' 
AND table_schema = 'public'
AND is_nullable = 'NO'
ORDER BY ordinal_position;

-- If there are issues with the new columns, we might need to alter them to be nullable
-- For example, if default_value was created as NOT NULL by mistake:
-- ALTER TABLE public.surat_field_mapping ALTER COLUMN default_value DROP NOT NULL;
-- ALTER TABLE public.surat_field_mapping ALTER COLUMN custom_type DROP NOT NULL;
-- ALTER TABLE public.surat_field_mapping ALTER COLUMN static_value DROP NOT NULL;

-- Also check if there are any trigger functions that might be interfering
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'surat_field_mapping'
AND event_object_schema = 'public';
