
-- Increase the length of RT and RW columns to accommodate longer values
ALTER TABLE public.penduduk 
ALTER COLUMN rt TYPE VARCHAR(5),
ALTER COLUMN rw TYPE VARCHAR(5);

-- Add comment to clarify the new length
COMMENT ON COLUMN public.penduduk.rt IS 'RT (Rukun Tetangga) - max 5 characters';
COMMENT ON COLUMN public.penduduk.rw IS 'RW (Rukun Warga) - max 5 characters';
