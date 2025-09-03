
-- Update wilayah table untuk menyesuaikan dengan kebutuhan
-- Hapus data yang ada terlebih dahulu
DELETE FROM wilayah;

-- Insert data dusun sesuai dengan yang ada di dropdown penduduk
INSERT INTO wilayah (kode, nama, jenis, kepala, status, jumlah_kk, jumlah_penduduk) VALUES
('DUS001', 'Dusun I', 'Dusun', 'Kepala Dusun I', 'Aktif', 0, 0),
('DUS002', 'Dusun II', 'Dusun', 'Kepala Dusun II', 'Aktif', 0, 0),
('DUS003', 'Dusun III', 'Dusun', 'Kepala Dusun III', 'Aktif', 0, 0),
('DUS004', 'Dusun IV', 'Dusun', 'Kepala Dusun IV', 'Aktif', 0, 0),
('DUS005', 'Dusun Rambutan', 'Dusun', 'Kepala Dusun Rambutan', 'Aktif', 0, 0),
('DUS006', 'Dusun Kelapa', 'Dusun', 'Kepala Dusun Kelapa', 'Aktif', 0, 0),
('DUS007', 'Dusun Nangka', 'Dusun', 'Kepala Dusun Nangka', 'Aktif', 0, 0),
('DUS008', 'Dusun Jambu', 'Dusun', 'Kepala Dusun Jambu', 'Aktif', 0, 0),
('DUS009', 'Dusun Sawo', 'Dusun', 'Kepala Dusun Sawo', 'Aktif', 0, 0),
('DUS010', 'Dusun Jeruk Nipis', 'Dusun', 'Kepala Dusun Jeruk Nipis', 'Aktif', 0, 0),
('DUS011', 'Dusun Sirsak', 'Dusun', 'Kepala Dusun Sirsak', 'Aktif', 0, 0),
('DUS012', 'Dusun Mangga', 'Dusun', 'Kepala Dusun Mangga', 'Aktif', 0, 0),
('DUS013', 'Dusun Manggis', 'Dusun', 'Kepala Dusun Manggis', 'Aktif', 0, 0),
('DUS014', 'Dusun Durian', 'Dusun', 'Kepala Dusun Durian', 'Aktif', 0, 0),
('DUS015', 'Tidak Diketahui', 'Dusun', 'Tidak Ada', 'Aktif', 0, 0);

-- Buat fungsi untuk update jumlah KK dan penduduk otomatis
CREATE OR REPLACE FUNCTION update_wilayah_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update jumlah KK dan penduduk untuk dusun yang terpengaruh
    UPDATE wilayah 
    SET 
        jumlah_kk = (
            SELECT COUNT(DISTINCT no_kk) 
            FROM penduduk 
            WHERE dusun = wilayah.nama 
            AND no_kk IS NOT NULL 
            AND no_kk != ''
        ),
        jumlah_penduduk = (
            SELECT COUNT(*) 
            FROM penduduk 
            WHERE dusun = wilayah.nama
        ),
        updated_at = NOW()
    WHERE nama IN (
        COALESCE(NEW.dusun, ''), 
        COALESCE(OLD.dusun, '')
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Buat trigger untuk update otomatis saat data penduduk berubah
DROP TRIGGER IF EXISTS trigger_update_wilayah_stats ON penduduk;
CREATE TRIGGER trigger_update_wilayah_stats
    AFTER INSERT OR UPDATE OR DELETE ON penduduk
    FOR EACH ROW
    EXECUTE FUNCTION update_wilayah_statistics();

-- Update data statistik wilayah berdasarkan data penduduk yang ada
UPDATE wilayah 
SET 
    jumlah_kk = (
        SELECT COUNT(DISTINCT no_kk) 
        FROM penduduk 
        WHERE dusun = wilayah.nama 
        AND no_kk IS NOT NULL 
        AND no_kk != ''
    ),
    jumlah_penduduk = (
        SELECT COUNT(*) 
        FROM penduduk 
        WHERE dusun = wilayah.nama
    ),
    updated_at = NOW();
