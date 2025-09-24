-- Add display_type column to form_tugas table to allow choosing between table or deck view
ALTER TABLE public.form_tugas 
ADD COLUMN IF NOT EXISTS display_type TEXT DEFAULT 'table' CHECK (display_type IN ('table', 'deck')),
ADD COLUMN IF NOT EXISTS deck_display_fields JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.form_tugas.display_type IS 'Menentukan tampilan data form: table (tabel) atau deck (kartu)';
COMMENT ON COLUMN public.form_tugas.deck_display_fields IS 'Daftar field yang akan ditampilkan dalam tampilan deck, termasuk pengaturan tampilan masing-masing field';