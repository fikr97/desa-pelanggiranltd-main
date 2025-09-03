
-- Tambahkan kolom urutan_display dan bertanggung_jawab_kepada pada tabel perangkat_desa jika belum ada
ALTER TABLE public.perangkat_desa 
ADD COLUMN IF NOT EXISTS bertanggung_jawab_kepada uuid REFERENCES public.perangkat_desa(id),
ADD COLUMN IF NOT EXISTS urutan_display integer DEFAULT 0;

-- Update data yang ada untuk mengisi urutan_display dengan nilai urutan (untuk data lama)
UPDATE public.perangkat_desa 
SET urutan_display = urutan 
WHERE urutan_display = 0;

-- Buat index agar pencarian lebih cepat pada hirarki
CREATE INDEX IF NOT EXISTS idx_perangkat_desa_hierarchy ON public.perangkat_desa(bertanggung_jawab_kepada);
CREATE INDEX IF NOT EXISTS idx_perangkat_desa_urutan ON public.perangkat_desa(urutan_display);
