-- Migration: Fitur Upload Dokumen Persyaratan Surat Tanah Desa
-- Date: 2026-05-17
-- Description:
--   1. Create dokumen_tanah_pengajuan table (main submission)
--   2. Create dokumen_tanah_files table (uploaded files per submission)
--   3. Create storage bucket 'dokumen-tanah'
--   4. RLS policies for role-based access
--   5. Insert permissions for all roles

-- ============================================================
-- 1. TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS dokumen_tanah_pengajuan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jenis_surat TEXT NOT NULL CHECK (jenis_surat IN ('GR', 'HB', 'SKT', 'WR')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'diajukan', 'diverifikasi', 'disetujui', 'ditolak')),
  is_serikat BOOLEAN DEFAULT FALSE,
  serikat_keterangan TEXT,
  harga_jual TEXT,
  harga_keterangan TEXT,
  catatan_verifikasi TEXT,
  catatan_approval TEXT,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  sempadan_data JSONB DEFAULT '[]'::jsonb,
  ahli_waris_data JSONB DEFAULT '[]'::jsonb,
  serikat_penjual_data JSONB DEFAULT '[]'::jsonb,
  serikat_pembeli_data JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dokumen_tanah_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pengajuan_id UUID NOT NULL REFERENCES dokumen_tanah_pengajuan(id) ON DELETE CASCADE,
  kategori TEXT NOT NULL,
  slot_id TEXT,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dokumen_tanah_pengajuan_user ON dokumen_tanah_pengajuan(user_id);
CREATE INDEX IF NOT EXISTS idx_dokumen_tanah_pengajuan_status ON dokumen_tanah_pengajuan(status);
CREATE INDEX IF NOT EXISTS idx_dokumen_tanah_files_pengajuan ON dokumen_tanah_files(pengajuan_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_dokumen_tanah_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dokumen_tanah_updated_at
  BEFORE UPDATE ON dokumen_tanah_pengajuan
  FOR EACH ROW EXECUTE FUNCTION update_dokumen_tanah_updated_at();

-- ============================================================
-- 2. RLS POLICIES
-- ============================================================

ALTER TABLE dokumen_tanah_pengajuan ENABLE ROW LEVEL SECURITY;
ALTER TABLE dokumen_tanah_files ENABLE ROW LEVEL SECURITY;

-- Pengajuan: user can CRUD their own
CREATE POLICY "Users can view own pengajuan" ON dokumen_tanah_pengajuan
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pengajuan" ON dokumen_tanah_pengajuan
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft pengajuan" ON dokumen_tanah_pengajuan
  FOR UPDATE USING (auth.uid() = user_id AND status IN ('draft', 'ditolak'));

-- Admin/Kades/Sekdes can view all submissions
CREATE POLICY "Admin can view all pengajuan" ON dokumen_tanah_pengajuan
  FOR SELECT USING (is_admin(auth.uid()));

-- Sekdes can verify (update status to diverifikasi)
CREATE POLICY "Verifier can update pengajuan" ON dokumen_tanah_pengajuan
  FOR UPDATE USING (
    is_admin(auth.uid()) AND status IN ('diajukan', 'diverifikasi')
  );

-- Files: follow parent pengajuan access
CREATE POLICY "Users can view own files" ON dokumen_tanah_files
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM dokumen_tanah_pengajuan p WHERE p.id = pengajuan_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own files" ON dokumen_tanah_files
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM dokumen_tanah_pengajuan p WHERE p.id = pengajuan_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own files" ON dokumen_tanah_files
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM dokumen_tanah_pengajuan p WHERE p.id = pengajuan_id AND p.user_id = auth.uid() AND p.status IN ('draft', 'ditolak'))
  );

CREATE POLICY "Admin can view all files" ON dokumen_tanah_files
  FOR SELECT USING (is_admin(auth.uid()));

-- ============================================================
-- 3. STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('dokumen-tanah', 'dokumen-tanah', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload dokumen tanah" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'dokumen-tanah' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view own dokumen tanah files" ON storage.objects
  FOR SELECT USING (bucket_id = 'dokumen-tanah' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own dokumen tanah files" ON storage.objects
  FOR DELETE USING (bucket_id = 'dokumen-tanah' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- 4. PERMISSIONS for dokumen_tanah category
-- ============================================================

-- Kadus: can create/submit pengajuan
INSERT INTO role_permissions (role, permission, description, is_enabled) VALUES
  ('kadus', 'dokumen_tanah:view', 'Lihat pengajuan dokumen tanah sendiri', true),
  ('kadus', 'dokumen_tanah:create', 'Buat pengajuan dokumen tanah baru', true),
  ('kadus', 'dokumen_tanah:edit', 'Edit draft pengajuan dokumen tanah', true),
  ('kadus', 'dokumen_tanah:submit', 'Submit pengajuan dokumen tanah', true),
  ('kadus', 'sidebar:view:dokumen_tanah', 'Tampilkan menu Dokumen Tanah di sidebar', true)
ON CONFLICT DO NOTHING;

-- Kaur/Kasi: same as kadus
INSERT INTO role_permissions (role, permission, description, is_enabled) VALUES
  ('kaur_kasi', 'dokumen_tanah:view', 'Lihat pengajuan dokumen tanah sendiri', true),
  ('kaur_kasi', 'dokumen_tanah:create', 'Buat pengajuan dokumen tanah baru', true),
  ('kaur_kasi', 'dokumen_tanah:edit', 'Edit draft pengajuan dokumen tanah', true),
  ('kaur_kasi', 'dokumen_tanah:submit', 'Submit pengajuan dokumen tanah', true),
  ('kaur_kasi', 'sidebar:view:dokumen_tanah', 'Tampilkan menu Dokumen Tanah di sidebar', true)
ON CONFLICT DO NOTHING;

-- Sekretaris Desa: can verify
INSERT INTO role_permissions (role, permission, description, is_enabled) VALUES
  ('sekretaris_desa', 'dokumen_tanah:view', 'Lihat semua pengajuan dokumen tanah', true),
  ('sekretaris_desa', 'dokumen_tanah:verify', 'Verifikasi pengajuan dokumen tanah', true),
  ('sekretaris_desa', 'sidebar:view:dokumen_tanah', 'Tampilkan menu Dokumen Tanah di sidebar', true)
ON CONFLICT DO NOTHING;

-- Kades: can approve/reject
INSERT INTO role_permissions (role, permission, description, is_enabled) VALUES
  ('kades', 'dokumen_tanah:view', 'Lihat semua pengajuan dokumen tanah', true),
  ('kades', 'dokumen_tanah:verify', 'Verifikasi pengajuan dokumen tanah', true),
  ('kades', 'dokumen_tanah:approve', 'Setujui/tolak pengajuan dokumen tanah', true),
  ('kades', 'sidebar:view:dokumen_tanah', 'Tampilkan menu Dokumen Tanah di sidebar', true)
ON CONFLICT DO NOTHING;

-- Administrator: full access
INSERT INTO role_permissions (role, permission, description, is_enabled) VALUES
  ('administrator', 'dokumen_tanah:view', 'Lihat semua pengajuan dokumen tanah', true),
  ('administrator', 'dokumen_tanah:create', 'Buat pengajuan dokumen tanah baru', true),
  ('administrator', 'dokumen_tanah:edit', 'Edit draft pengajuan dokumen tanah', true),
  ('administrator', 'dokumen_tanah:submit', 'Submit pengajuan dokumen tanah', true),
  ('administrator', 'dokumen_tanah:verify', 'Verifikasi pengajuan dokumen tanah', true),
  ('administrator', 'dokumen_tanah:approve', 'Setujui/tolak pengajuan dokumen tanah', true),
  ('administrator', 'sidebar:view:dokumen_tanah', 'Tampilkan menu Dokumen Tanah di sidebar', true)
ON CONFLICT DO NOTHING;
