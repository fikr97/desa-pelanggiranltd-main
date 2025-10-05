-- MIGRASI PERBAIKAN DARURAT: Memperbaiki Semua Error Ambigu dan Masalah Penghapusan Data pada Fungsi RPC

-- Hapus semua fungsi yang mungkin menyebabkan error
DROP FUNCTION IF EXISTS get_form_data_with_penduduk(UUID);
DROP FUNCTION IF EXISTS update_form_data_with_penduduk_check(UUID, UUID, UUID, JSONB);

-- Buat ulang fungsi get_form_data_with_penduduk dengan pendekatan yang lebih aman
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
    SELECT ft.visibilitas_dusun INTO form_visibility
    FROM form_tugas ft
    WHERE ft.id = p_form_id;

    -- Dapatkan informasi pengguna
    SELECT pr.role, pr.dusun INTO user_role, user_dusun
    FROM public.profiles pr
    WHERE pr.user_id = auth.uid();

    RAISE LOG 'get_form_data_with_penduduk - user_role: %, user_dusun: %, form_visibility: %', user_role, user_dusun, form_visibility;

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
GRANT EXECUTE ON FUNCTION get_form_data_with_penduduk TO authenticated;

-- Buat ulang fungsi update dengan pendekatan yang lebih aman dan dengan logging yang lebih baik
CREATE OR REPLACE FUNCTION update_form_data_with_penduduk_check(
    p_form_data_id UUID,
    p_form_id UUID,
    p_penduduk_id UUID,
    p_data_custom JSONB
)
RETURNS TABLE(success BOOLEAN, message TEXT, updated_data JSONB) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    form_visibility TEXT;
    user_role TEXT;
    user_dusun TEXT;
    penduduk_dusun TEXT;
    allowed BOOLEAN := FALSE;
    affected_rows INTEGER;
    original_data JSONB;
BEGIN
    -- Log untuk debugging awal
    RAISE LOG 'update_form_data_with_penduduk_check called with form_data_id: %, form_id: %, penduduk_id: %', p_form_data_id, p_form_id, p_penduduk_id;

    -- Dapatkan informasi dari form
    SELECT ft.visibilitas_dusun INTO form_visibility
    FROM form_tugas ft
    WHERE ft.id = p_form_id;

    -- Dapatkan informasi pengguna
    SELECT pr.role, pr.dusun INTO user_role, user_dusun
    FROM public.profiles pr
    WHERE pr.user_id = auth.uid();

    -- Dapatkan dusun dari penduduk target
    SELECT p.dusun INTO penduduk_dusun
    FROM penduduk p
    WHERE p.id = p_penduduk_id;

    RAISE LOG 'Update check - user_role: %, user_dusun: %, penduduk_dusun: %, form_visibility: %', user_role, user_dusun, penduduk_dusun, form_visibility;

    -- Cek apakah update diperbolehkan
    IF user_role = 'admin' THEN
        allowed := TRUE;
        RAISE LOG 'Admin access granted';
    ELSIF form_visibility = 'semua_data' AND user_role = 'kadus' THEN
        allowed := TRUE;
        RAISE LOG 'Kadus access granted for all_data form';
    ELSIF user_role = 'kadus' AND user_dusun = penduduk_dusun THEN
        allowed := TRUE;
        RAISE LOG 'Kadus access granted for own dusun';
    END IF;

    -- Jika tidak diizinkan, kembalikan error
    IF NOT allowed THEN
        RAISE LOG 'Update not allowed for user role: %, form visibility: %, user dusun: %, penduduk dusun: %', user_role, form_visibility, user_dusun, penduduk_dusun;
        RETURN QUERY SELECT FALSE as success, 'Akses ditolak: Anda tidak diizinkan mengupdate data ini' as message, NULL::JSONB as updated_data;
        RETURN;
    END IF;

    -- Dapatkan data sebelum update untuk keperluan logging
    SELECT to_jsonb(ftd)
    INTO original_data
    FROM form_tugas_data ftd
    WHERE ftd.id = p_form_data_id;

    -- Log untuk debugging sebelum update
    RAISE LOG 'Before update - original data: %', original_data;

    -- Update data
    UPDATE form_tugas_data 
    SET 
        penduduk_id = p_penduduk_id,
        data_custom = p_data_custom, 
        updated_at = NOW()
    WHERE id = p_form_data_id;

    -- Periksa apakah baris benar-benar ter-update
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    RAISE LOG 'Update operation affected % rows for ID: %', affected_rows, p_form_data_id;

    IF affected_rows = 0 THEN
        RAISE LOG 'Update failed - no rows affected for ID: %', p_form_data_id;
        RETURN QUERY SELECT FALSE as success, 'Tidak ada data yang diupdate. Mungkin ID tidak ditemukan atau akses ditolak.' as message, NULL::JSONB as updated_data;
        RETURN;
    END IF;

    -- Kembalikan data yang telah diupdate
    SELECT to_jsonb(ftd)
    INTO updated_data
    FROM form_tugas_data ftd
    WHERE ftd.id = p_form_data_id;

    RAISE LOG 'Updated data: %', updated_data;

    RETURN QUERY 
    SELECT TRUE as success, 'Data berhasil diupdate' as message, updated_data;

END;
$$;

-- Beri akses ke authenticated users
GRANT EXECUTE ON FUNCTION update_form_data_with_penduduk_check TO authenticated;