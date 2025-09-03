
-- Pastikan struktur tabel penduduk sesuai dengan template Excel
-- Hapus dan buat ulang tabel dengan kolom yang tepat
DROP TABLE IF EXISTS public.penduduk CASCADE;

CREATE TABLE public.penduduk (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  no_kk VARCHAR(16),
  nik VARCHAR(16) NOT NULL,
  nama VARCHAR(255) NOT NULL,
  jenis_kelamin VARCHAR(20),
  tempat_lahir VARCHAR(100),
  tanggal_lahir DATE,
  golongan_darah VARCHAR(5),
  agama VARCHAR(50),
  status_kawin VARCHAR(50),
  status_hubungan VARCHAR(50),
  pendidikan VARCHAR(100),
  pekerjaan VARCHAR(100),
  nama_ibu VARCHAR(255),
  nama_ayah VARCHAR(255),
  rt VARCHAR(2),
  rw VARCHAR(2),
  dusun VARCHAR(100),
  nama_kep_kel VARCHAR(255),
  alamat_lengkap TEXT,
  nama_prop VARCHAR(100) DEFAULT 'Sumatera Utara',
  nama_kab VARCHAR(100) DEFAULT 'Batu Bara',
  nama_kec VARCHAR(100) DEFAULT 'Laut Tador',
  nama_kel VARCHAR(100) DEFAULT 'Pelanggiran Laut Tador',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Buat indeks untuk performa
CREATE INDEX idx_penduduk_nik ON public.penduduk(nik);
CREATE INDEX idx_penduduk_no_kk ON public.penduduk(no_kk);
CREATE INDEX idx_penduduk_nama ON public.penduduk(nama);

-- Tambahkan komentar untuk dokumentasi
COMMENT ON TABLE public.penduduk IS 'Tabel data penduduk desa';
COMMENT ON COLUMN public.penduduk.rt IS 'RT (Rukun Tetangga) - max 2 karakter, contoh: 01, 1';
COMMENT ON COLUMN public.penduduk.rw IS 'RW (Rukun Warga) - max 2 karakter, contoh: 01, 1';
COMMENT ON COLUMN public.penduduk.nik IS 'NIK - harus 16 digit';
COMMENT ON COLUMN public.penduduk.no_kk IS 'Nomor Kartu Keluarga - harus 16 digit';
