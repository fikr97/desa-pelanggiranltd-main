
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
AS $$
DECLARE
    stats json;
BEGIN
    SELECT json_build_object(
        'total_penduduk', (SELECT COUNT(*) FROM penduduk),
        'total_laki_laki', (SELECT COUNT(*) FROM penduduk WHERE jenis_kelamin ILIKE 'Laki-laki'),
        'total_perempuan', (SELECT COUNT(*) FROM penduduk WHERE jenis_kelamin ILIKE 'Perempuan'),
        'total_kk', (SELECT COUNT(DISTINCT no_kk) FROM penduduk WHERE no_kk IS NOT NULL),
        'age_groups', (
            SELECT json_agg(t) FROM (
                SELECT
                    CASE
                        WHEN age <= 17 THEN '0-17'
                        WHEN age > 17 AND age <= 30 THEN '18-30'
                        WHEN age > 30 AND age <= 45 THEN '31-45'
                        WHEN age > 45 AND age <= 60 THEN '46-60'
                        ELSE '60+'
                    END as range,
                    COUNT(*) as jumlah
                FROM (
                    SELECT date_part('year', age(tanggal_lahir)) as age FROM penduduk WHERE tanggal_lahir IS NOT NULL
                ) as ages
                GROUP BY range
                ORDER BY MIN(CASE 
                    WHEN range = '0-17' THEN 1 
                    WHEN range = '18-30' THEN 2 
                    WHEN range = '31-45' THEN 3 
                    WHEN range = '46-60' THEN 4 
                    ELSE 5 
                END)
            ) t
        ),
        'pendidikan', (
            SELECT json_agg(t) FROM (
                SELECT pendidikan, COUNT(*) as jumlah 
                FROM penduduk 
                WHERE pendidikan IS NOT NULL AND pendidikan != '' 
                GROUP BY pendidikan 
                ORDER BY jumlah DESC
            ) t
        ),
        'agama', (
            SELECT json_agg(t) FROM (
                SELECT agama, COUNT(*) as jumlah 
                FROM penduduk 
                WHERE agama IS NOT NULL AND agama != '' 
                GROUP BY agama 
                ORDER BY jumlah DESC
            ) t
        ),
        'pekerjaan', (
            SELECT json_agg(t) FROM (
                SELECT pekerjaan, COUNT(*) as jumlah 
                FROM penduduk 
                WHERE pekerjaan IS NOT NULL AND pekerjaan != '' 
                GROUP BY pekerjaan 
                ORDER BY jumlah DESC 
                LIMIT 10
            ) t
        )
    )
    INTO stats;

    RETURN stats;
END;
$$;
