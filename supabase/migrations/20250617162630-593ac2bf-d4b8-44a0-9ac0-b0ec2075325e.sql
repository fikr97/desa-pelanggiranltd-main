
-- Tabel untuk menyimpan template surat
CREATE TABLE public.surat_template (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_template VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  konten_template TEXT NOT NULL, -- JSON format untuk menyimpan template dengan placeholder
  format_nomor_surat VARCHAR(100) DEFAULT '[indeks_no]/[no]/[kode]/[kode_desa]/[tahun]',
  indeks_nomor INTEGER DEFAULT 470,
  kode_surat VARCHAR(10) DEFAULT 'UMUM',
  kode_desa VARCHAR(10) DEFAULT 'DSA',
  status VARCHAR(20) DEFAULT 'Aktif',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel untuk menyimpan surat yang telah dibuat
CREATE TABLE public.surat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.surat_template(id) ON DELETE CASCADE,
  nomor_surat VARCHAR(100) NOT NULL UNIQUE,
  judul_surat VARCHAR(255) NOT NULL,
  konten_surat TEXT NOT NULL, -- Konten final setelah merge
  tanggal_surat DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'Draft',
  data_penduduk JSONB, -- Data penduduk yang terlibat dalam surat
  data_tambahan JSONB, -- Data tambahan untuk placeholder khusus
  file_docx_url TEXT, -- URL file DOCX yang dihasilkan
  created_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabel untuk mapping field placeholder dengan data source
CREATE TABLE public.surat_field_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES public.surat_template(id) ON DELETE CASCADE,
  field_name VARCHAR(100) NOT NULL, -- Nama placeholder tanpa kurung kurawal
  field_type VARCHAR(50) NOT NULL, -- 'penduduk', 'alamat', 'sistem', 'tanggal', 'custom'
  field_source VARCHAR(100), -- Kolom source dari tabel (misal: 'nama', 'nik', 'alamat_lengkap')
  field_format VARCHAR(50), -- 'upper', 'lower', 'capitalize', 'normal'
  is_multiple BOOLEAN DEFAULT false, -- Apakah field ini bisa multiple (untuk multiple penduduk/tanggal)
  urutan INTEGER DEFAULT 1, -- Urutan untuk field multiple
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Buat indeks untuk performa
CREATE INDEX idx_surat_template_status ON public.surat_template(status);
CREATE INDEX idx_surat_nomor ON public.surat(nomor_surat);
CREATE INDEX idx_surat_template_id ON public.surat(template_id);
CREATE INDEX idx_field_mapping_template ON public.surat_field_mapping(template_id);

-- Fungsi untuk generate nomor surat
CREATE OR REPLACE FUNCTION public.generate_nomor_surat(template_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  template_rec RECORD;
  nomor_result TEXT;
  current_year TEXT;
  next_indeks INTEGER;
BEGIN
  -- Ambil data template
  SELECT * INTO template_rec FROM public.surat_template WHERE id = template_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template tidak ditemukan';
  END IF;
  
  -- Dapatkan tahun saat ini
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Hitung nomor urut berikutnya untuk template ini di tahun ini
  SELECT COALESCE(MAX(CAST(SPLIT_PART(nomor_surat, '/', 1) AS INTEGER)), 0) + 1
  INTO next_indeks
  FROM public.surat 
  WHERE template_id = template_id_param 
    AND EXTRACT(YEAR FROM tanggal_surat) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Generate nomor surat berdasarkan format template
  nomor_result := template_rec.format_nomor_surat;
  nomor_result := REPLACE(nomor_result, '[indeks_no]', template_rec.indeks_nomor::TEXT);
  nomor_result := REPLACE(nomor_result, '[no]', next_indeks::TEXT);
  nomor_result := REPLACE(nomor_result, '[kode]', template_rec.kode_surat);
  nomor_result := REPLACE(nomor_result, '[kode_desa]', template_rec.kode_desa);
  nomor_result := REPLACE(nomor_result, '[tahun]', current_year);
  
  RETURN nomor_result;
END;
$$ LANGUAGE plpgsql;

-- Storage bucket untuk file DOCX surat
INSERT INTO storage.buckets (id, name, public) 
VALUES ('surat-docx', 'surat-docx', false)
ON CONFLICT (id) DO NOTHING;

-- Policy untuk bucket surat-docx
CREATE POLICY "Allow authenticated users to upload surat files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'surat-docx' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view surat files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'surat-docx' 
  AND auth.role() = 'authenticated'
);

-- Tambahkan komentar untuk dokumentasi
COMMENT ON TABLE public.surat_template IS 'Template surat dengan placeholder untuk merge data';
COMMENT ON TABLE public.surat IS 'Surat yang telah dibuat dari template';
COMMENT ON TABLE public.surat_field_mapping IS 'Mapping field placeholder dengan sumber data';
COMMENT ON COLUMN public.surat_template.konten_template IS 'Template dalam format JSON dengan placeholder {field_name}';
COMMENT ON COLUMN public.surat_field_mapping.field_type IS 'Tipe field: penduduk, alamat, sistem, tanggal, custom';
COMMENT ON COLUMN public.surat_field_mapping.field_format IS 'Format teks: upper, lower, capitalize, normal';
