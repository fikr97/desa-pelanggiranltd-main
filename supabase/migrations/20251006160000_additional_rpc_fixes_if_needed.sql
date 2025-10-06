-- MIGRASI PERBAIKAN TAMBAHAN: Fix untuk fungsi RPC tambahan yang digunakan dalam mode 'semua_data'

-- Perbaikan untuk fungsi update_form_data_with_penduduk_check jika ada
-- Ini adalah fungsi lain yang mungkin digunakan dalam mode 'semua_data'
-- Kita perlu memastikan bahwa fungsi ini juga mendukung penduduk_id NULL

-- Cek apakah fungsi update_form_data_with_penduduk_check ada
-- Jika ada, kita perlu memperbarui juga untuk mendukung p_penduduk_id NULL

-- Hapus fungsi lama jika ada (hanya jika benar-benar ada)
-- DROP FUNCTION IF EXISTS update_form_data_with_penduduk_check(UUID, UUID, UUID, JSONB);

-- Jika fungsi update_form_data_with_penduduk_check pernah dibuat sebelumnya, contoh perbaikannya:
/*
CREATE OR REPLACE FUNCTION update_form_data_with_penduduk_check(
    p_form_data_id UUID,
    p_form_id UUID, 
    p_penduduk_id UUID,
    p_data_custom JSONB
)
RETURNS TABLE(success BOOLEAN, message TEXT) 
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

    -- Cek apakah update diperbolehkan
    IF user_role = 'admin' THEN
        allowed := TRUE;
    ELSIF user_role = 'kadus' THEN
        IF form_visibility = 'semua_data' THEN
            -- Dalam mode 'semua_data', kadus bisa mengupdate data apa pun
            allowed := TRUE;
        ELSIF p_penduduk_id IS NULL THEN
            -- Dalam mode lain, izinkan kadus membuat data tanpa penduduk terkait
            allowed := TRUE;
        ELSIF user_dusun = penduduk_dusun THEN
            -- Jika dusun cocok, tetap izinkan
            allowed := TRUE;
        ELSE
            -- Penduduk dari dusun lain
            allowed := FALSE;
        END IF;
    END IF;

    -- Jika tidak diizinkan, kembalikan error
    IF NOT allowed THEN
        RETURN QUERY SELECT FALSE as success, 'Akses ditolak: Anda tidak diizinkan mengupdate data ini' as message;
        RETURN;
    END IF;

    -- Lakukan update
    UPDATE form_tugas_data 
    SET 
        penduduk_id = p_penduduk_id,
        data_custom = p_data_custom,
        updated_at = NOW()
    WHERE id = p_form_data_id;

    -- Kembalikan hasil
    RETURN QUERY 
    SELECT TRUE as success, 'Data berhasil diupdate' as message;

EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT FALSE as success, 'Terjadi kesalahan saat mengupdate data: ' || SQLERRM as message;

END;
$$;

GRANT EXECUTE ON FUNCTION update_form_data_with_penduduk_check TO authenticated;
*/

-- File ini berfungsi sebagai dokumentasi dan contoh jika fungsi serupa diperlukan di masa depan
-- Kita sudah menyelesaikan perbaikan RLS dan fungsi RPC utama untuk mendukung penduduk_id NULL