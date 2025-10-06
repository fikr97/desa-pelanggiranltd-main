-- MIGRASI TAMBAHAN: Fungsi untuk menyisipkan data form dalam mode 'semua_data' secara aman

-- Hapus fungsi lama jika ada
DROP FUNCTION IF EXISTS insert_form_data_for_all_dusun(UUID, UUID, JSONB);

-- Buat fungsi baru untuk menyisipkan data form dengan pengecekan akses yang tepat
CREATE OR REPLACE FUNCTION insert_form_data_for_all_dusun(
    p_form_id UUID,
    p_penduduk_id UUID,
    p_data_custom JSONB
)
RETURNS TABLE(success BOOLEAN, message TEXT, inserted_id UUID) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
    form_visibility TEXT;
    user_role TEXT;
    user_dusun TEXT;
    penduduk_dusun TEXT;
    allowed BOOLEAN := FALSE;
    new_record_id UUID;
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

    RAISE LOG 'Insert check - user_role: %, user_dusun: %, penduduk_dusun: %, form_visibility: %', user_role, user_dusun, penduduk_dusun, form_visibility;

    -- Cek apakah insert diperbolehkan
    IF user_role = 'admin' THEN
        allowed := TRUE;
        RAISE LOG 'Admin insert access granted';
    ELSIF user_role = 'kadus' THEN
        IF form_visibility = 'semua_data' THEN
            -- Dalam mode 'semua_data', kadus bisa menambah data apa pun
            allowed := TRUE;
            RAISE LOG 'Kadus insert access granted for all_data form';
        ELSE
            -- Dalam mode lain, periksa dusun
            IF p_penduduk_id IS NOT NULL AND user_dusun = penduduk_dusun THEN
                allowed := TRUE;
                RAISE LOG 'Kadus insert access granted for own dusun';
            ELSIF p_penduduk_id IS NULL THEN
                -- Kadus tidak boleh membuat data tanpa penduduk di mode selain 'semua_data'
                allowed := FALSE;
                RAISE LOG 'Kadus insert denied for non-resident entry in restricted mode';
            ELSE
                -- Penduduk dari dusun lain
                allowed := FALSE;
                RAISE LOG 'Kadus insert denied for resident from other dusun';
            END IF;
        END IF;
    END IF;

    -- Jika tidak diizinkan, kembalikan error
    IF NOT allowed THEN
        RAISE LOG 'Insert not allowed for user role: %, form visibility: %, user dusun: %, penduduk dusun: %', user_role, form_visibility, user_dusun, penduduk_dusun;
        RETURN QUERY SELECT FALSE as success, 'Akses ditolak: Anda tidak diizinkan menyimpan data ini' as message, NULL::UUID as inserted_id;
        RETURN;
    END IF;

    -- Lakukan insert data
    INSERT INTO form_tugas_data (form_tugas_id, penduduk_id, data_custom, user_id)
    VALUES (p_form_id, p_penduduk_id, p_data_custom, auth.uid())
    RETURNING id INTO new_record_id;

    -- Kembalikan data yang telah disisipkan
    RETURN QUERY 
    SELECT TRUE as success, 'Data berhasil disimpan' as message, new_record_id as inserted_id;

EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error during insert operation: %', SQLERRM;
        RETURN QUERY SELECT FALSE as success, 'Terjadi kesalahan saat menyimpan data: ' || SQLERRM as message, NULL::UUID as inserted_id;

END;
$;

-- Beri akses ke authenticated users
GRANT EXECUTE ON FUNCTION insert_form_data_for_all_dusun TO authenticated;