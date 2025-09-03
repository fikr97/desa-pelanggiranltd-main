
-- Pastikan kolom RT dan RW memiliki panjang yang cukup untuk data import
-- Jika migrasi sebelumnya belum berjalan, ini akan mengubah ukurannya
ALTER TABLE public.penduduk 
ALTER COLUMN rt TYPE VARCHAR(5),
ALTER COLUMN rw TYPE VARCHAR(5);

-- Pastikan tidak ada constraint yang membatasi panjang
-- Update comment untuk kejelasan
COMMENT ON COLUMN public.penduduk.rt IS 'RT (Rukun Tetangga) - max 5 characters, contoh: 001, 01, 1';
COMMENT ON COLUMN public.penduduk.rw IS 'RW (Rukun Warga) - max 5 characters, contoh: 001, 01, 1';
