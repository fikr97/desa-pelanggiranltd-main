-- Tabel untuk menyimpan definisi Form Tugas
CREATE TABLE form_tugas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_tugas TEXT NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Komentar untuk Supabase agar mengenali tabel
COMMENT ON TABLE form_tugas IS 'Menyimpan definisi dari setiap formulir tugas yang dibuat oleh admin.';

-- Aktifkan Row Level Security
ALTER TABLE form_tugas ENABLE ROW LEVEL SECURITY;

-- Kebijakan: Admin dapat mengelola semua form tugas
CREATE POLICY "Admin can manage form_tugas" ON form_tugas
FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Kebijakan: Pengguna terautentikasi dapat melihat form tugas
CREATE POLICY "Authenticated users can view form_tugas" ON form_tugas
FOR SELECT
USING (auth.role() = 'authenticated');


-- Tabel untuk menyimpan field-field dari setiap Form Tugas
CREATE TABLE form_tugas_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_tugas_id UUID NOT NULL REFERENCES form_tugas(id) ON DELETE CASCADE,
    nama_field TEXT NOT NULL,
    label_field TEXT NOT NULL,
    tipe_field TEXT NOT NULL, -- 'predefined' atau 'custom'
    sumber_data TEXT, -- contoh: 'penduduk.nama_lengkap' jika tipe_field = 'predefined'
    opsi_pilihan JSONB, -- untuk tipe field custom seperti 'select' atau 'radio'
    urutan INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE form_tugas_fields IS 'Menyimpan definisi setiap field dalam sebuah formulir tugas.';

ALTER TABLE form_tugas_fields ENABLE ROW LEVEL SECURITY;

-- Kebijakan: Admin dapat mengelola field form
CREATE POLICY "Admin can manage form_tugas_fields" ON form_tugas_fields
FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Kebijakan: Pengguna terautentikasi dapat melihat field form
CREATE POLICY "Authenticated users can view form_tugas_fields" ON form_tugas_fields
FOR SELECT
USING (auth.role() = 'authenticated');


-- Tabel untuk menyimpan data yang diisi oleh Kadus
CREATE TABLE form_tugas_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_tugas_id UUID NOT NULL REFERENCES form_tugas(id) ON DELETE CASCADE,
    penduduk_id UUID NOT NULL REFERENCES penduduk(id) ON DELETE CASCADE,
    data_custom JSONB,
    submitted_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE form_tugas_data IS 'Menyimpan data yang diinput oleh pengguna untuk setiap formulir tugas.';

ALTER TABLE form_tugas_data ENABLE ROW LEVEL SECURITY;

-- Kebijakan: Pengguna dapat mengelola data yang mereka kirimkan
CREATE POLICY "Users can manage their own submitted data" ON form_tugas_data
FOR ALL
USING (auth.uid() = submitted_by)
WITH CHECK (auth.uid() = submitted_by);

-- Kebijakan: Admin dapat mengelola semua data isian
CREATE POLICY "Admin can manage all data" ON form_tugas_data
FOR ALL
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);
