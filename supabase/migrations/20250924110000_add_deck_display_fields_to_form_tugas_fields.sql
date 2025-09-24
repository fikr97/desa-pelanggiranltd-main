-- Add deck display columns to form_tugas_fields table
ALTER TABLE public.form_tugas_fields 
ADD COLUMN IF NOT EXISTS deck_visible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deck_display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS deck_display_format TEXT DEFAULT 'default' CHECK (deck_display_format IN ('default', 'header', 'full-width')),
ADD COLUMN IF NOT EXISTS deck_is_header BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.form_tugas_fields.deck_visible IS 'Menentukan apakah field ini akan ditampilkan dalam tampilan kartu';
COMMENT ON COLUMN public.form_tugas_fields.deck_display_order IS 'Urutan tampilan field dalam tampilan kartu';
COMMENT ON COLUMN public.form_tugas_fields.deck_display_format IS 'Format tampilan field dalam kartu (default, header, full-width)';
COMMENT ON COLUMN public.form_tugas_fields.deck_is_header IS 'Menandakan apakah field ini digunakan sebagai header kartu';