
-- Create perangkat_desa table
CREATE TABLE IF NOT EXISTS public.perangkat_desa (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    nama character varying NOT NULL,
    jabatan character varying NOT NULL,
    nip character varying,
    foto text,
    urutan integer DEFAULT 0,
    status character varying DEFAULT 'Aktif'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Insert default perangkat desa data
INSERT INTO public.perangkat_desa (nama, jabatan, nip, urutan) VALUES
('Budi Santoso, S.Sos', 'Kepala Desa', '196501011988031001', 1),
('Siti Aminah, S.AP', 'Sekretaris Desa', '197803152005022001', 2),
('Ahmad Wijaya', 'Kepala Urusan Pemerintahan', '198205102008011002', 3),
('Dewi Sari, A.Md', 'Kepala Urusan Pembangunan', '199001052015032001', 4),
('Rahmat Hidayat', 'Kepala Urusan Kesejahteraan', '198807122012011001', 5),
('Indra Gunawan', 'Kepala Dusun 1', NULL, 6),
('Joko Susilo', 'Kepala Dusun 2', NULL, 7),
('Supardi', 'Kepala Dusun 3', NULL, 8);
