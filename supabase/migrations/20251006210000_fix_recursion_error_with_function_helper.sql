-- MIGRASI PERBAIKAN KRITIS: Memperbaiki infinite recursion pada RLS form_tugas_data
-- dengan pendekatan sederhana menggunakan fungsi helper

-- Hapus kebijakan lama yang menyebabkan infinite recursion
DROP POLICY IF EXISTS "Fixed insert policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed update policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed select policy for form_tugas_data with nullable penduduk_id" ON form_tugas_data;
DROP POLICY IF EXISTS "Fixed delete policy for form_tugas_data with all_data_mode" ON form_tugas_data;

-- Buat fungsi helper yang aman untuk dijalankan dalam RLS (dengan SECURITY DEFINER)
CREATE OR REPLACE FUNCTION check_form_data_access(user_id_param UUID, form_data_id_param UUID, operation TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Ini penting agar bisa mengakses tabel lain tanpa RLS
AS $$
DECLARE
    user_role TEXT;
    user_dusun TEXT;
    form_visibility TEXT;
    data_penduduk_dusun TEXT;
    result BOOLEAN := FALSE;
BEGIN
    -- Dapatkan informasi pengguna
    SELECT p.role, p.dusun INTO user_role, user_dusun
    FROM profiles p
    WHERE p.user_id = user_id_param;
    
    IF user_role IS NULL THEN
        RETURN FALSE; -- User tidak dikenal
    END IF;
    
    -- Dapatkan visibilitas form dan dusun penduduk terkait
    SELECT ft.visibilitas_dusun, p.dusun
    INTO form_visibility, data_penduduk_dusun
    FROM form_tugas_data ftd
    JOIN form_tugas ft ON ftd.form_tugas_id = ft.id
    LEFT JOIN penduduk p ON ftd.penduduk_id = p.id
    WHERE ftd.id = form_data_id_param;
    
    -- Cek akses berdasarkan role dan kondisi
    IF user_role = 'admin' THEN
        result := TRUE;
    ELSIF user_role = 'kadus' THEN
        IF form_visibility = 'semua_data' THEN
            result := TRUE; -- Kadus bisa akses semua data dalam mode semua_data
        ELSIF data_penduduk_dusun IS NULL THEN
            -- Data tanpa penduduk terkait, izinkan jika sesuai dengan konteks
            result := TRUE;
        ELSIF data_penduduk_dusun = user_dusun THEN
            result := TRUE; -- Kadus bisa akses data dari dusun mereka
        END IF;
    END IF;
    
    RETURN result;
END;
$$;

-- Beri akses ke service role agar bisa digunakan dalam RLS
GRANT EXECUTE ON FUNCTION check_form_data_access TO service_role;
GRANT EXECUTE ON FUNCTION check_form_data_access TO authenticated;

-- Buat kebijakan RLS yang sederhana menggunakan fungsi helper
CREATE POLICY "Safe select policy for form_tugas_data" 
ON form_tugas_data FOR SELECT
TO authenticated
USING (
    check_form_data_access(auth.uid(), id, 'select')
);

CREATE POLICY "Safe insert policy for form_tugas_data" 
ON form_tugas_data FOR INSERT
TO authenticated
WITH CHECK (
    check_form_data_access(auth.uid(), id, 'insert') -- Note: id akan NULL saat insert, jadi kita perlu pendekatan lain
);

-- Karena fungsi tidak bisa digunakan langsung dalam WITH CHECK untuk insert, kita gunakan pendekatan berbeda
-- Hapus dan buat ulang kebijakan insert
DROP POLICY IF EXISTS "Safe insert policy for form_tugas_data" ON form_tugas_data;

-- Kebijakan insert yang lebih sederhana
CREATE POLICY "Safe insert policy for form_tugas_data" 
ON form_tugas_data FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT role FROM profiles WHERE user_id = auth.uid()) IN ('admin', 'kadus')
);

-- Kebijakan update yang kompleks tapi tidak menyebabkan recursion
CREATE POLICY "Safe update policy for form_tugas_data" 
ON form_tugas_data FOR UPDATE
TO authenticated
USING ( -- Kondisi akses ke baris
    check_form_data_access(auth.uid(), id, 'update')
)
WITH CHECK ( -- Kondisi untuk update
    check_form_data_access(auth.uid(), id, 'update')
);

-- Kebijakan delete yang aman
CREATE POLICY "Safe delete policy for form_tugas_data" 
ON form_tugas_data FOR DELETE
TO authenticated
USING (
    check_form_data_access(auth.uid(), id, 'delete')
);

-- Pastikan RLS diaktifkan
ALTER TABLE form_tugas_data ENABLE ROW LEVEL SECURITY;