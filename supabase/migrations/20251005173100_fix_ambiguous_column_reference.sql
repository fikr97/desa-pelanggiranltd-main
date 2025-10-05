-- MIGRASI PERBAIKAN: Memperbaiki Error Ambigu pada Referensi Kolom

-- Hapus fungsi lama yang bermasalah
DROP FUNCTION IF EXISTS update_form_data_with_penduduk_check(UUID, UUID, UUID, JSONB);

-- Buat ulang fungsi dengan qualifier kolom yang jelas
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

    -- Kembalikan data yang sudah diupdate dengan qualifier kolom yang jelas
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