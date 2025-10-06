-- MIGRASI TAMBAHAN: Fungsi untuk memperbarui data form dalam mode 'semua_data' secara aman

-- Hapus fungsi lama jika ada
DROP FUNCTION IF EXISTS update_form_data_for_all_dusun(UUID, UUID, UUID, JSONB);

-- Buat fungsi baru untuk memperbarui data form dengan pengecekan akses yang tepat
CREATE OR REPLACE FUNCTION update_form_data_for_all_dusun(
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
    current_form_data RECORD;
    allowed BOOLEAN := FALSE;
    affected_rows INTEGER;
BEGIN
    -- Log untuk debugging awal
    RAISE LOG 'update_form_data_for_all_dusun called with form_data_id: %, form_id: %, penduduk_id: %', p_form_data_id, p_form_id, p_penduduk_id;

    -- Validasi parameter yang diperlukan
    IF p_form_data_id IS NULL OR p_form_id IS NULL THEN
        RAISE LOG 'Update failed - Required parameters (form_data_id or form_id) are NULL';
        RETURN QUERY SELECT FALSE as success, 'Parameter yang diperlukan tidak boleh kosong' as message, NULL::JSONB as updated_data;
        RETURN;
    END IF;

    -- Periksa apakah record yang akan diupdate benar-benar ada
    SELECT * INTO current_form_data
    FROM form_tugas_data ftd
    WHERE ftd.id = p_form_data_id;

    -- Jika record tidak ditemukan, kembalikan error
    IF current_form_data.id IS NULL THEN
        RAISE LOG 'Update failed - record with ID % not found', p_form_data_id;
        RETURN QUERY SELECT FALSE as success, 'Record tidak ditemukan atau Anda tidak memiliki akses untuk mengedit data ini' as message, NULL::JSONB as updated_data;
        RETURN;
    END IF;

    -- Dapatkan informasi dari form
    SELECT ft.visibilitas_dusun INTO form_visibility
    FROM form_tugas ft
    WHERE ft.id = p_form_id;

    -- Dapatkan informasi pengguna
    SELECT pr.role, pr.dusun INTO user_role, user_dusun
    FROM public.profiles pr
    WHERE pr.user_id = auth.uid();

    -- Dapatkan dusun dari penduduk target (jika p_penduduk_id tidak null)
    IF p_penduduk_id IS NOT NULL THEN
        SELECT p.dusun INTO penduduk_dusun
        FROM penduduk p
        WHERE p.id = p_penduduk_id;
    END IF;

    RAISE LOG 'Update check - user_role: %, user_dusun: %, penduduk_dusun: %, form_visibility: %', user_role, user_dusun, penduduk_dusun, form_visibility;

    -- Cek apakah update diperbolehkan
    IF user_role = 'admin' THEN
        allowed := TRUE;
        RAISE LOG 'Admin access granted';
    ELSIF user_role = 'kadus' THEN
        IF form_visibility = 'semua_data' THEN
            -- Dalam mode 'semua_data', kadus bisa mengupdate data apa pun
            allowed := TRUE;
            RAISE LOG 'Kadus access granted for all_data form';
        ELSE
            -- Dalam mode lain, periksa dusun
            IF p_penduduk_id IS NOT NULL AND user_dusun = penduduk_dusun THEN
                allowed := TRUE;
                RAISE LOG 'Kadus access granted for own dusun';
            ELSIF p_penduduk_id IS NULL THEN
                -- Kadus tidak boleh membuat data tanpa penduduk di mode selain 'semua_data'
                allowed := FALSE;
                RAISE LOG 'Kadus access denied for non-resident entry in restricted mode';
            ELSE
                -- Penduduk dari dusun lain
                allowed := FALSE;
                RAISE LOG 'Kadus access denied for resident from other dusun';
            END IF;
        END IF;
    END IF;

    -- Jika tidak diizinkan, kembalikan error
    IF NOT allowed THEN
        RAISE LOG 'Update not allowed for user role: %, form visibility: %, user dusun: %, penduduk dusun: %', user_role, form_visibility, user_dusun, penduduk_dusun;
        RETURN QUERY SELECT FALSE as success, 'Akses ditolak: Anda tidak diizinkan mengupdate data ini' as message, NULL::JSONB as updated_data;
        RETURN;
    END IF;

    -- Log untuk debugging sebelum update
    RAISE LOG 'Before update - original data: form_tugas_id=%, penduduk_id=%, data_custom=%', current_form_data.form_tugas_id, current_form_data.penduduk_id, current_form_data.data_custom;

    -- Lakukan update hanya untuk field yang tidak null
    -- Ini mencegah pengalihan data ke NULL jika p_data_custom kosong
    IF p_data_custom IS NOT NULL THEN
        UPDATE form_tugas_data 
        SET 
            penduduk_id = p_penduduk_id,  -- Gunakan p_penduduk_id langsung (bisa null)
            data_custom = p_data_custom,  -- Gunakan p_data_custom langsung jika tidak null
            updated_at = NOW()
        WHERE id = p_form_data_id;
    ELSE
        -- Jika p_data_custom null, hanya update penduduk_id dan updated_at
        UPDATE form_tugas_data 
        SET 
            penduduk_id = p_penduduk_id,  -- Gunakan p_penduduk_id langsung (bisa null)
            updated_at = NOW()
        WHERE id = p_form_data_id;
    END IF;

    -- Periksa apakah baris benar-benar ter-update
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    RAISE LOG 'Update operation affected % rows for ID: %', affected_rows, p_form_data_id;

    IF affected_rows = 0 THEN
        RAISE LOG 'Update failed - no rows affected for ID: %', p_form_data_id;
        RETURN QUERY SELECT FALSE as success, 'Tidak ada data yang diupdate. Mungkin ID tidak ditemukan atau akses ditolak.' as message, NULL::JSONB as updated_data;
        RETURN;
    END IF;

    -- Kembalikan data yang telah diupdate
    RETURN QUERY 
    SELECT TRUE as success, 'Data berhasil diupdate' as message, to_jsonb(ftd)
    FROM form_tugas_data ftd
    WHERE ftd.id = p_form_data_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error during update operation: %', SQLERRM;
        RETURN QUERY SELECT FALSE as success, 'Terjadi kesalahan saat mengupdate data: ' || SQLERRM as message, NULL::JSONB as updated_data;

END;
$$;

-- Beri akses ke authenticated users
GRANT EXECUTE ON FUNCTION update_form_data_for_all_dusun TO authenticated;