CREATE OR REPLACE FUNCTION public.get_penduduk_stats()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    stats json;
BEGIN
    SELECT json_build_object(
        'total', COUNT(*),
        'laki', COUNT(*) FILTER (WHERE jenis_kelamin = 'Laki-laki'),
        'perempuan', COUNT(*) FILTER (WHERE jenis_kelamin = 'Perempuan'),
        'kk', COUNT(*) FILTER (WHERE status_hubungan = 'Kepala Keluarga')
    )
    INTO stats
    FROM public.penduduk;

    RETURN stats;
END;
$$;
