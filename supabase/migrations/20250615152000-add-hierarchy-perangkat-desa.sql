
-- Add hierarchy and ordering columns to perangkat_desa table
ALTER TABLE public.perangkat_desa 
ADD COLUMN IF NOT EXISTS bertanggung_jawab_kepada uuid REFERENCES public.perangkat_desa(id),
ADD COLUMN IF NOT EXISTS urutan_display integer DEFAULT 0;

-- Update existing data to set proper hierarchy and ordering
UPDATE public.perangkat_desa 
SET urutan_display = urutan 
WHERE urutan_display = 0;

-- Create index for better performance on hierarchy queries
CREATE INDEX IF NOT EXISTS idx_perangkat_desa_hierarchy ON public.perangkat_desa(bertanggung_jawab_kepada);
CREATE INDEX IF NOT EXISTS idx_perangkat_desa_urutan ON public.perangkat_desa(urutan_display);
