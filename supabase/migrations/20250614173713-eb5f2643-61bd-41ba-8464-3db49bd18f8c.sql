
-- Add missing columns to penduduk table to match import template
ALTER TABLE public.penduduk 
ADD COLUMN alamat_lengkap TEXT,
ADD COLUMN nama_kep_kel VARCHAR(100),
ADD COLUMN nama_prop VARCHAR(100) DEFAULT 'Sumatera Utara',
ADD COLUMN nama_kab VARCHAR(100) DEFAULT 'Batu Bara', 
ADD COLUMN nama_kec VARCHAR(100) DEFAULT 'Laut Tador',
ADD COLUMN nama_kel VARCHAR(100) DEFAULT 'Pelanggiran Laut Tador';

-- Add comments to describe the columns
COMMENT ON COLUMN public.penduduk.alamat_lengkap IS 'Alamat lengkap penduduk (optional field)';
COMMENT ON COLUMN public.penduduk.nama_kep_kel IS 'Nama kepala keluarga';
COMMENT ON COLUMN public.penduduk.nama_prop IS 'Nama provinsi';
COMMENT ON COLUMN public.penduduk.nama_kab IS 'Nama kabupaten/kota';
COMMENT ON COLUMN public.penduduk.nama_kec IS 'Nama kecamatan';
COMMENT ON COLUMN public.penduduk.nama_kel IS 'Nama kelurahan/desa';
