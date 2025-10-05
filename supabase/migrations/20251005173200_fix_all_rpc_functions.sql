-- MIGRASI PERBAIKAN TOTAL: Memperbaiki Semua Fungsi RPC dengan Error Syntax

-- Hapus semua fungsi lama yang bermasalah
DROP FUNCTION IF EXISTS get_form_data_with_penduduk(UUID);
DROP FUNCTION IF EXISTS update_form_data_with_penduduk_check(UUID, UUID, UUID, JSONB);

-- Buat ulang fungsi get_form_data_with_penduduk dengan syntax yang benar
CREATE OR REPLACE FUNCTION get_form_data_with_penduduk(
    p_form_id UUID
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
    SELECT visibilitas_dusun INTO form_visibility
    FROM form_tugas
    WHERE id = p_form_id;

    -- Dapatkan informasi pengguna
    SELECT role, dusun INTO user_role, user_dusun
    FROM public.profiles
    WHERE user_id = auth.uid();

    -- Jika admin, kembalikan semua data
    IF user_role = 'admin' THEN
        RETURN QUERY
        SELECT 
            ftd.id as form_data_id,
            ftd.form_tugas_id,
            ftd.penduduk_id,
            ftd.data_custom,
            ftd.submitted_by,
            ftd.created_at,
            ftd.updated_at,
            ftd.user_id,
            -- Data penduduk
            p.no_kk as penduduk_no_kk,
            p.nik as penduduk_nik,
            p.nama as penduduk_nama,
            p.jenis_kelamin as penduduk_jenis_kelamin,
            p.tempat_lahir as penduduk_tempat_lahir,
            p.tanggal_lahir as penduduk_tanggal_lahir,
            p.golongan_darah as penduduk_golongan_darah,
            p.agama as penduduk_agama,
            p.status_kawin as penduduk_status_kawin,
            p.status_hubungan as penduduk_status_hubungan,
            p.pendidikan as penduduk_pendidikan,
            p.pekerjaan as penduduk_pekerjaan,
            p.nama_ibu as penduduk_nama_ibu,
            p.nama_ayah as penduduk_nama_ayah,
            p.rt as penduduk_rt,
            p.rw as penduduk_rw,
            p.dusun as penduduk_dusun,
            p.nama_kep_kel as penduduk_nama_kep_kel,
            p.alamat_lengkap as penduduk_alamat_lengkap,
            p.nama_prop as penduduk_nama_prop,
            p.nama_kab as penduduk_nama_kab,
            p.nama_kec as penduduk_nama_kec,
            p.nama_kel as penduduk_nama_kel
        FROM form_tugas_data ftd
        JOIN penduduk p ON ftd.penduduk_id = p.id
        WHERE ftd.form_tugas_id = p_form_id
        ORDER BY ftd.created_at;
    END IF;

    -- Jika form dalam mode 'semua_data' dan user adalah kadus
    IF form_visibility = 'semua_data' AND user_role = 'kadus' THEN
        RETURN QUERY
        SELECT 
            ftd.id as form_data_id,
            ftd.form_tugas_id,
            ftd.penduduk_id,
            ftd.data_custom,
            ftd.submitted_by,
            ftd.created_at,
            ftd.updated_at,
            ftd.user_id,
            -- Data penduduk
            p.no_kk as penduduk_no_kk,
            p.nik as penduduk_nik,
            p.nama as penduduk_nama,
            p.jenis_kelamin as penduduk_jenis_kelamin,
            p.tempat_lahir as penduduk_tempat_lahir,
            p.tanggal_lahir as penduduk_tanggal_lahir,
            p.golongan_darah as penduduk_golongan_darah,
            p.agama as penduduk_agama,
            p.status_kawin as penduduk_status_kawin,
            p.status_hubungan as penduduk_status_hubungan,
            p.pendidikan as penduduk_pendidikan,
            p.pekerjaan as penduduk_pekerjaan,
            p.nama_ibu as penduduk_nama_ibu,
            p.nama_ayah as penduduk_nama_ayah,
            p.rt as penduduk_rt,
            p.rw as penduduk_rw,
            p.dusun as penduduk_dusun,
            p.nama_kep_kel as penduduk_nama_kep_kel,
            p.alamat_lengkap as penduduk_alamat_lengkap,
            p.nama_prop as penduduk_nama_prop,
            p.nama_kab as penduduk_nama_kab,
            p.nama_kec as penduduk_nama_kec,
            p.nama_kel as penduduk_nama_kel
        FROM form_tugas_data ftd
        JOIN penduduk p ON ftd.penduduk_id = p.id
        WHERE ftd.form_tugas_id = p_form_id
        ORDER BY ftd.created_at;
    END IF;

    -- Untuk mode lainnya, kembalikan hanya data dari dusun user
    IF user_role = 'kadus' AND form_visibility != 'semua_data' THEN
        RETURN QUERY
        SELECT 
            ftd.id as form_data_id,
            ftd.form_tugas_id,
            ftd.penduduk_id,
            ftd.data_custom,
            ftd.submitted_by,
            ftd.created_at,
            ftd.updated_at,
            ftd.user_id,
            -- Data penduduk
            p.no_kk as penduduk_no_kk,
            p.nik as penduduk_nik,
            p.nama as penduduk_nama,
            p.jenis_kelamin as penduduk_jenis_kelamin,
            p.tempat_lahir as penduduk_tempat_lahir,
            p.tanggal_lahir as penduduk_tanggal_lahir,
            p.golongan_darah as penduduk_golongan_darah,
            p.agama as penduduk_agama,
            p.status_kawin as penduduk_status_kawin,
            p.status_hubungan as penduduk_status_hubungan,
            p.pendidikan as penduduk_pendidikan,
            p.pekerjaan as penduduk_pekerjaan,
            p.nama_ibu as penduduk_nama_ibu,
            p.nama_ayah as penduduk_nama_ayah,
            p.rt as penduduk_rt,
            p.rw as penduduk_rw,
            p.dusun as penduduk_dusun,
            p.nama_kep_kel as penduduk_nama_kep_kel,
            p.alamat_lengkap as penduduk_alamat_lengkap,
            p.nama_prop as penduduk_nama_prop,
            p.nama_kab as penduduk_nama_kab,
            p.nama_kec as penduduk_nama_kec,
            p.nama_kel as penduduk_nama_kel
        FROM form_tugas_data ftd
        JOIN penduduk p ON ftd.penduduk_id = p.id
        WHERE ftd.form_tugas_id = p_form_id
        AND p.dusun = user_dusun
        ORDER BY ftd.created_at;
    END IF;

END;
$$;

-- Beri akses ke authenticated users
GRANT EXECUTE ON FUNCTION get_form_data_with_penduduk TO authenticated;

-- Buat ulang fungsi update_form_data_with_penduduk_check dengan syntax yang benar
CREATE OR REPLACE FUNCTION update_form_data_with_penduduk_check(
    p_form_data_id UUID,
    p_form_id UUID,
    p_penduduk_id UUID,
    p_data_custom JSONB
)
RETURNS TABLE(success BOOLEAN, message TEXT, updated_data JSON) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    form_visibility TEXT;
    user_role TEXT;
    user_dusun TEXT;
    penduduk_dusun TEXT;
    allowed BOOLEAN := FALSE;
BEGIN
    -- Dapatkan informasi dari form
    SELECT visibilitas_dusun INTO form_visibility
    FROM form_tugas
    WHERE id = p_form_id;

    -- Dapatkan informasi pengguna
    SELECT role, dusun INTO user_role, user_dusun
    FROM public.profiles
    WHERE user_id = auth.uid();

    -- Dapatkan dusun dari penduduk target
    SELECT dusun INTO penduduk_dusun
    FROM penduduk
    WHERE id = p_penduduk_id;

    -- Cek apakah update diperbolehkan
    IF user_role = 'admin' THEN
        allowed := TRUE;
    ELSIF form_visibility = 'semua_data' AND user_role = 'kadus' THEN
        allowed := TRUE;
    ELSIF user_role = 'kadus' AND user_dusun = penduduk_dusun THEN
        allowed := TRUE;
    END IF;

    -- Jika tidak diizinkan, kembalikan error
    IF NOT allowed THEN
        RETURN QUERY SELECT FALSE as success, 'Akses ditolak: Anda tidak diizinkan mengupdate data ini' as message, NULL::JSON as updated_data;
        RETURN;
    END IF;

    -- Update data
    UPDATE form_tugas_data ftd
    SET 
        penduduk_id = p_penduduk_id,
        data_custom = p_data_custom, 
        updated_at = NOW()
    WHERE ftd.id = p_form_data_id;

    -- Kembalikan data yang sudah diupdate dengan qualifier yang jelas
    RETURN QUERY 
    SELECT TRUE as success, 'Data berhasil diupdate' as message,
           row_to_json(row) as updated_data
    FROM (
        SELECT 
            ftd.id,
            ftd.form_tugas_id,
            ftd.penduduk_id,
            ftd.data_custom,
            ftd.submitted_by,
            ftd.created_at,
            ftd.updated_at,
            ftd.user_id
        FROM form_tugas_data ftd 
        WHERE ftd.id = p_form_data_id
    ) row;

END;
$$;

-- Beri akses ke authenticated users
GRANT EXECUTE ON FUNCTION update_form_data_with_penduduk_check TO authenticated;