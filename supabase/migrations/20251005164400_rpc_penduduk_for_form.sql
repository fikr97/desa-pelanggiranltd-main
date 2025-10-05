-- MIGRASI KOMPONEN: Perbaikan Akses Penduduk dalam Form (Pendekatan Kombinasi)

-- Karena keterbatasan RLS dalam mendeteksi konteks, kita akan buat solusi kombinasi:
-- 1. Pertahankan RLS penduduk yang aman untuk fitur lain
-- 2. Buat fungsi RPC khusus untuk mengambil penduduk dalam konteks form
-- 3. Modifikasi komponen frontend untuk menggunakan fungsi ini ketika dalam mode 'semua_data'

-- Buat fungsi RPC untuk mengambil penduduk dengan akses selektif untuk form
CREATE OR REPLACE FUNCTION get_penduduk_for_form(
    p_form_id UUID
)
RETURNS TABLE(
    id UUID,
    no_kk CHARACTER VARYING,
    nik CHARACTER VARYING,
    nama CHARACTER VARYING,
    jenis_kelamin CHARACTER VARYING,
    tempat_lahir CHARACTER VARYING,
    tanggal_lahir DATE,
    golongan_darah CHARACTER VARYING,
    agama CHARACTER VARYING,
    status_kawin CHARACTER VARYING,
    status_hubungan CHARACTER VARYING,
    pendidikan CHARACTER VARYING,
    pekerjaan CHARACTER VARYING,
    nama_ibu CHARACTER VARYING,
    nama_ayah CHARACTER VARYING,
    rt CHARACTER VARYING,
    rw CHARACTER VARYING,
    dusun CHARACTER VARYING,
    nama_kep_kel CHARACTER VARYING,
    alamat_lengkap TEXT,
    nama_prop CHARACTER VARYING,
    nama_kab CHARACTER VARYING,
    nama_kec CHARACTER VARYING,
    nama_kel CHARACTER VARYING,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
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

    -- Jika admin, kembalikan semua penduduk
    IF user_role = 'admin' THEN
        RETURN QUERY
        SELECT 
            p.id, p.no_kk, p.nik, p.nama, p.jenis_kelamin, p.tempat_lahir, p.tanggal_lahir,
            p.golongan_darah, p.agama, p.status_kawin, p.status_hubungan, p.pendidikan,
            p.pekerjaan, p.nama_ibu, p.nama_ayah, p.rt, p.rw, p.dusun, p.nama_kep_kel,
            p.alamat_lengkap, p.nama_prop, p.nama_kab, p.nama_kec, p.nama_kel,
            p.created_at, p.updated_at
        FROM penduduk p;
    END IF;

    -- Jika form dalam mode 'semua_data', kembalikan semua penduduk
    IF form_visibility = 'semua_data' AND user_role = 'kadus' THEN
        RETURN QUERY
        SELECT 
            p.id, p.no_kk, p.nik, p.nama, p.jenis_kelamin, p.tempat_lahir, p.tanggal_lahir,
            p.golongan_darah, p.agama, p.status_kawin, p.status_hubungan, p.pendidikan,
            p.pekerjaan, p.nama_ibu, p.nama_ayah, p.rt, p.rw, p.dusun, p.nama_kep_kel,
            p.alamat_lengkap, p.nama_prop, p.nama_kab, p.nama_kec, p.nama_kel,
            p.created_at, p.updated_at
        FROM penduduk p;
    END IF;

    -- Untuk mode lainnya, kembalikan hanya penduduk dari dusun user
    IF user_role = 'kadus' THEN
        RETURN QUERY
        SELECT 
            p.id, p.no_kk, p.nik, p.nama, p.jenis_kelamin, p.tempat_lahir, p.tanggal_lahir,
            p.golongan_darah, p.agama, p.status_kawin, p.status_hubungan, p.pendidikan,
            p.pekerjaan, p.nama_ibu, p.nama_ayah, p.rt, p.rw, p.dusun, p.nama_kep_kel,
            p.alamat_lengkap, p.nama_prop, p.nama_kab, p.nama_kec, p.nama_kel,
            p.created_at, p.updated_at
        FROM penduduk p
        WHERE p.dusun = user_dusun;
    END IF;

END;
$$;

-- Beri akses ke authenticated users
GRANT EXECUTE ON FUNCTION get_penduduk_for_form TO authenticated;