-- MIGRASI TAMBAHAN: Fungsi untuk memperbaiki tampilan data dusun saat pengeditan dalam mode 'semua_data'

-- Hapus fungsi lama jika ada
DROP FUNCTION IF EXISTS get_form_data_with_penduduk_for_edit(UUID, UUID);

-- Buat fungsi baru untuk mengambil data form dengan penduduk secara lengkap
CREATE OR REPLACE FUNCTION get_form_data_with_penduduk_for_edit(
    p_form_id UUID,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE(
    -- Kolom dari form_tugas_data
    form_data_id UUID,
    form_tugas_id UUID,
    penduduk_id UUID,
    data_custom JSONB,
    submitted_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    user_id UUID,
    
    -- Kolom dari penduduk (untuk keperluan tampilan)
    penduduk_no_kk CHARACTER VARYING,
    penduduk_nik CHARACTER VARYING,
    penduduk_nama CHARACTER VARYING,
    penduduk_jenis_kelamin CHARACTER VARYING,
    penduduk_tempat_lahir CHARACTER VARYING,
    penduduk_tanggal_lahir DATE,
    penduduk_golongan_darah CHARACTER VARYING,
    penduduk_agama CHARACTER VARYING,
    penduduk_status_kawin CHARACTER VARYING,
    penduduk_status_hubungan CHARACTER VARYING,
    penduduk_pendidikan CHARACTER VARYING,
    penduduk_pekerjaan CHARACTER VARYING,
    penduduk_nama_ibu CHARACTER VARYING,
    penduduk_nama_ayah CHARACTER VARYING,
    penduduk_rt CHARACTER VARYING,
    penduduk_rw CHARACTER VARYING,
    penduduk_dusun CHARACTER VARYING,
    penduduk_nama_kep_kel CHARACTER VARYING,
    penduduk_alamat_lengkap TEXT,
    penduduk_nama_prop CHARACTER VARYING,
    penduduk_nama_kab CHARACTER VARYING,
    penduduk_nama_kec CHARACTER VARYING,
    penduduk_nama_kel CHARACTER VARYING
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    form_visibility TEXT;
    user_role TEXT;
    user_dusun TEXT;
BEGIN
    -- Dapatkan informasi dari form
    SELECT ft.visibilitas_dusun INTO form_visibility
    FROM form_tugas ft
    WHERE ft.id = p_form_id;

    -- Dapatkan informasi pengguna
    SELECT pr.role, pr.dusun INTO user_role, user_dusun
    FROM public.profiles pr
    WHERE pr.user_id = p_user_id;

    -- Jika admin, kembalikan semua data
    IF user_role = 'admin' THEN
        RETURN QUERY
        SELECT 
            ftd.id,
            ftd.form_tugas_id,
            ftd.penduduk_id,
            ftd.data_custom,
            ftd.submitted_by,
            ftd.created_at,
            ftd.updated_at,
            ftd.user_id,
            -- Data penduduk
            p.no_kk,
            p.nik,
            p.nama,
            p.jenis_kelamin,
            p.tempat_lahir,
            p.tanggal_lahir,
            p.golongan_darah,
            p.agama,
            p.status_kawin,
            p.status_hubungan,
            p.pendidikan,
            p.pekerjaan,
            p.nama_ibu,
            p.nama_ayah,
            p.rt,
            p.rw,
            p.dusun,
            p.nama_kep_kel,
            p.alamat_lengkap,
            p.nama_prop,
            p.nama_kab,
            p.nama_kec,
            p.nama_kel
        FROM form_tugas_data ftd
        JOIN penduduk p ON ftd.penduduk_id = p.id
        WHERE ftd.form_tugas_id = p_form_id
        ORDER BY ftd.created_at;
    END IF;

    -- Jika form dalam mode 'semua_data' dan user adalah kadus
    IF form_visibility = 'semua_data' AND user_role = 'kadus' THEN
        RETURN QUERY
        SELECT 
            ftd.id,
            ftd.form_tugas_id,
            ftd.penduduk_id,
            ftd.data_custom,
            ftd.submitted_by,
            ftd.created_at,
            ftd.updated_at,
            ftd.user_id,
            -- Data penduduk
            p.no_kk,
            p.nik,
            p.nama,
            p.jenis_kelamin,
            p.tempat_lahir,
            p.tanggal_lahir,
            p.golongan_darah,
            p.agama,
            p.status_kawin,
            p.status_hubungan,
            p.pendidikan,
            p.pekerjaan,
            p.nama_ibu,
            p.nama_ayah,
            p.rt,
            p.rw,
            p.dusun,
            p.nama_kep_kel,
            p.alamat_lengkap,
            p.nama_prop,
            p.nama_kab,
            p.nama_kec,
            p.nama_kel
        FROM form_tugas_data ftd
        JOIN penduduk p ON ftd.penduduk_id = p.id
        WHERE ftd.form_tugas_id = p_form_id
        ORDER BY ftd.created_at;
    END IF;

    -- Untuk mode 'hanya_dusun_saya' atau kondisi lainnya, kembalikan hanya data dari dusun user
    IF user_role = 'kadus' AND form_visibility != 'semua_data' THEN
        RETURN QUERY
        SELECT 
            ftd.id,
            ftd.form_tugas_id,
            ftd.penduduk_id,
            ftd.data_custom,
            ftd.submitted_by,
            ftd.created_at,
            ftd.updated_at,
            ftd.user_id,
            -- Data penduduk
            p.no_kk,
            p.nik,
            p.nama,
            p.jenis_kelamin,
            p.tempat_lahir,
            p.tanggal_lahir,
            p.golongan_darah,
            p.agama,
            p.status_kawin,
            p.status_hubungan,
            p.pendidikan,
            p.pekerjaan,
            p.nama_ibu,
            p.nama_ayah,
            p.rt,
            p.rw,
            p.dusun,
            p.nama_kep_kel,
            p.alamat_lengkap,
            p.nama_prop,
            p.nama_kab,
            p.nama_kec,
            p.nama_kel
        FROM form_tugas_data ftd
        JOIN penduduk p ON ftd.penduduk_id = p.id
        WHERE ftd.form_tugas_id = p_form_id
        AND p.dusun = user_dusun
        ORDER BY ftd.created_at;
    END IF;

END;
$$;

-- Beri akses ke authenticated users
GRANT EXECUTE ON FUNCTION get_form_data_with_penduduk_for_edit TO authenticated;