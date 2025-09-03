
-- Kembalikan kolom RT dan RW ke VARCHAR(2) untuk konsistensi
ALTER TABLE public.penduduk 
ALTER COLUMN rt TYPE VARCHAR(2),
ALTER COLUMN rw TYPE VARCHAR(2);

-- Update comment untuk kejelasan
COMMENT ON COLUMN public.penduduk.rt IS 'RT (Rukun Tetangga) - max 2 characters, contoh: 01, 1';
COMMENT ON COLUMN public.penduduk.rw IS 'RW (Rukun Warga) - max 2 characters, contoh: 01, 1';
