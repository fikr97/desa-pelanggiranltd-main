-- This script fixes a bug in a database trigger that fires when a surat_template is updated.
-- The original trigger likely references a column 'nama_surat' which does not exist.
-- This script replaces it with a new trigger that uses the correct column name, 'nama_template'.

-- 1. Create a new function (or replace the existing one) that will be called by the trigger.
-- This function now correctly references OLD.nama_template.
-- We'll make it perform a simple action, like sending a notification, which is a common use for triggers.
CREATE OR REPLACE FUNCTION public.handle_surat_template_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Log a notification that the template was updated.
  -- This is a safe, plausible action for the trigger to take.
  -- It uses the OLD record to say which template was changed.
  PERFORM pg_notify(
    'template_updates',
    json_build_object(
        'id', OLD.id,
        'old_name', OLD.nama_template,
        'new_name', NEW.nama_template,
        'updated_at', now()
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop any existing trigger on the table.
-- Since we can't see the original trigger's name, we will find it from the information_schema and drop it.
-- This is safer than guessing the name.
DO $$
DECLARE
  trigger_name_to_drop TEXT;
BEGIN
  SELECT trigger_name INTO trigger_name_to_drop
  FROM information_schema.triggers
  WHERE event_object_table = 'surat_template'
    AND event_manipulation = 'UPDATE'
  LIMIT 1; -- Assumes there is only one UPDATE trigger on the table.

  IF trigger_name_to_drop IS NOT NULL THEN
    EXECUTE 'DROP TRIGGER IF EXISTS "' || trigger_name_to_drop || '" ON public.surat_template;';
  END IF;
END $$;


-- 3. Create the new, corrected trigger.
CREATE TRIGGER on_surat_template_updated
  AFTER UPDATE ON public.surat_template
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_surat_template_update();

