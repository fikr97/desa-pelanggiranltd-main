
-- Tabel untuk data penduduk
CREATE TABLE public.penduduk (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nik VARCHAR(16) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  jenis_kelamin VARCHAR(10) NOT NULL CHECK (jenis_kelamin IN ('Laki-laki', 'Perempuan')),
  tempat_lahir VARCHAR(50),
  tanggal_lahir DATE,
  alamat TEXT,
  rt VARCHAR(3),
  rw VARCHAR(3),
  dusun VARCHAR(50),
  agama VARCHAR(20),
  status_kawin VARCHAR(20),
  pekerjaan VARCHAR(50),
  pendidikan VARCHAR(30),
  golongan_darah VARCHAR(2),
  nama_ayah VARCHAR(100),
  nama_ibu VARCHAR(100),
  status_hubungan VARCHAR(20),
  no_kk VARCHAR(16),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel untuk data wilayah
CREATE TABLE public.wilayah (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  kode VARCHAR(10) NOT NULL UNIQUE,
  nama VARCHAR(100) NOT NULL,
  jenis VARCHAR(20) NOT NULL CHECK (jenis IN ('Dusun', 'RW', 'RT')),
  kepala VARCHAR(100),
  parent_id UUID REFERENCES public.wilayah(id),
  jumlah_kk INTEGER DEFAULT 0,
  jumlah_penduduk INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Aktif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel untuk info desa
CREATE TABLE public.info_desa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_desa VARCHAR(100) NOT NULL,
  kode_desa VARCHAR(20),
  nama_kecamatan VARCHAR(100),
  nama_kabupaten VARCHAR(100),
  nama_provinsi VARCHAR(100),
  kode_pos VARCHAR(10),
  alamat_kantor TEXT,
  telepon VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(100),
  nama_kepala_desa VARCHAR(100),
  nip_kepala_desa VARCHAR(20),
  logo_desa TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert data awal info desa
INSERT INTO public.info_desa (nama_desa, kode_desa, nama_kecamatan, nama_kabupaten, nama_provinsi, kode_pos, alamat_kantor, telepon, email, nama_kepala_desa, nip_kepala_desa)
VALUES ('Desa Maju Jaya', '001', 'Kecamatan Sejahtera', 'Kabupaten Makmur', 'Provinsi Berkah', '12345', 'Jl. Merdeka No. 1', '(021) 12345678', 'desa@majujaya.go.id', 'Bapak Suharto', '196501011990031001');

-- Insert data contoh wilayah
INSERT INTO public.wilayah (kode, nama, jenis, kepala, jumlah_kk, jumlah_penduduk) VALUES
('DS001', 'Dusun Makmur', 'Dusun', 'Bapak Slamet', 145, 523),
('DS002', 'Dusun Sejahtera', 'Dusun', 'Bapak Wahyu', 98, 342),
('DS003', 'Dusun Merdeka', 'Dusun', 'Bapak Joko', 189, 678);

-- Insert data contoh penduduk
INSERT INTO public.penduduk (nik, nama, jenis_kelamin, tempat_lahir, tanggal_lahir, alamat, rt, rw, dusun, agama, status_kawin, pekerjaan, pendidikan, nama_ayah, nama_ibu, no_kk) VALUES
('3201234567890001', 'Ahmad Suryadi', 'Laki-laki', 'Jakarta', '1989-05-15', 'Jl. Merdeka No. 10', '01', '02', 'Dusun Makmur', 'Islam', 'Kawin', 'Petani', 'SMA', 'Budi Santoso', 'Siti Aminah', '3201234567890001'),
('3201234567890002', 'Siti Rahayu', 'Perempuan', 'Bandung', '1996-08-22', 'Jl. Sudirman No. 15', '02', '01', 'Dusun Sejahtera', 'Islam', 'Kawin', 'Guru', 'S1', 'Ahmad Rahman', 'Fatimah', '3201234567890002'),
('3201234567890003', 'Budi Santoso', 'Laki-laki', 'Surabaya', '1982-12-10', 'Jl. Diponegoro No. 8', '03', '02', 'Dusun Merdeka', 'Islam', 'Kawin', 'Wiraswasta', 'SMA', 'Joko Widodo', 'Sri Mulyani', '3201234567890003'),
('3201234567890004', 'Ani Kartika', 'Perempuan', 'Yogyakarta', '1999-03-05', 'Jl. Gatot Subroto No. 20', '01', '01', 'Dusun Makmur', 'Islam', 'Belum Kawin', 'Mahasiswa', 'SMA', 'Bambang Sudarsono', 'Rina Kartika', '3201234567890004');

-- Enable Row Level Security
ALTER TABLE public.penduduk ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wilayah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.info_desa ENABLE ROW LEVEL SECURITY;

-- Create policies untuk akses publik (karena belum ada autentikasi)
CREATE POLICY "Enable read access for all users" ON public.penduduk FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.penduduk FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.penduduk FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.penduduk FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.wilayah FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.wilayah FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.wilayah FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.wilayah FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON public.info_desa FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.info_desa FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.info_desa FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON public.info_desa FOR DELETE USING (true);
