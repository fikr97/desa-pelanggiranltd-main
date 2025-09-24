-- Add deck display columns to form_tugas_fields table if they don't exist
-- This migration ensures all the necessary columns are present

ALTER TABLE public.form_tugas_fields 
ADD COLUMN IF NOT EXISTS deck_visible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deck_display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deck_display_format TEXT DEFAULT 'default',
ADD COLUMN IF NOT EXISTS deck_is_header BOOLEAN DEFAULT FALSE;

-- Add check constraint for deck_display_format
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'form_tugas_fields_deck_display_format_check') THEN
    ALTER TABLE public.form_tugas_fields 
    ADD CONSTRAINT form_tugas_fields_deck_display_format_check 
    CHECK (deck_display_format IN ('default', 'header', 'full-width'));
  END IF;
END $$;

-- Update existing records to have proper default values
UPDATE public.form_tugas_fields 
SET 
  deck_visible = FALSE,
  deck_display_order = 0,
  deck_display_format = 'default',
  deck_is_header = FALSE
WHERE deck_visible IS NULL;

-- Add comments to columns
COMMENT ON COLUMN public.form_tugas_fields.deck_visible IS 'Menentukan apakah field ini akan ditampilkan dalam tampilan kartu';
COMMENT ON COLUMN public.form_tugas_fields.deck_display_order IS 'Urutan tampilan field dalam tampilan kartu';
COMMENT ON COLUMN public.form_tugas_fields.deck_display_format IS 'Format tampilan field dalam kartu (default, header, full-width)';
COMMENT ON COLUMN public.form_tugas_fields.deck_is_header IS 'Menandakan apakah field ini digunakan sebagai header kartu';