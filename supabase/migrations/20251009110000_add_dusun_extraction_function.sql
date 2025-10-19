-- MIGRASI TAMBAHAN: Membuat fungsi untuk mengekstrak informasi dusun dari data form_tugas_data
-- Terkadang informasi dusun bisa disimpan di dalam field data_custom (JSONB) dalam form

-- Buat fungsi untuk mengekstrak dusun dari data_custom jika field dusun ada di sana
CREATE OR REPLACE FUNCTION get_dusun_from_form_data(data_id UUID)
RETURNS TEXT AS $$
DECLARE
  result_dusun TEXT;
  user_dusun TEXT;
  penduduk_dusun TEXT;
  form_data RECORD;
BEGIN
  -- Ambil data form_tugas_data dan form_tugas terkait
  SELECT ftd.data_custom, ftd.penduduk_id, ft.visibilitas_dusun 
  INTO form_data
  FROM form_tugas_data ftd
  JOIN form_tugas ft ON ftd.form_tugas_id = ft.id
  WHERE ftd.id = data_id;
  
  -- Dapatkan dusun dari profile user
  SELECT dusun INTO user_dusun FROM public.profiles WHERE user_id = auth.uid();
  
  -- Dapatkan dusun dari penduduk jika ada
  IF form_data.penduduk_id IS NOT NULL THEN
    SELECT dusun INTO penduduk_dusun FROM penduduk WHERE id = form_data.penduduk_id;
  END IF;
  
  -- Jika ada informasi dusun dari penduduk, gunakan itu
  IF penduduk_dusun IS NOT NULL THEN
    RETURN penduduk_dusun;
  END IF;
  
  -- Jika tidak ada penduduk_id tetapi ada field dusun di data_custom, gunakan itu
  IF form_data.data_custom ? 'dusun' THEN
    RETURN form_data.data_custom->>'dusun';
  END IF;
  
  -- Jika tidak ada sama sekali, return NULL
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Berikan akses ke fungsi ini ke role authenticated
GRANT EXECUTE ON FUNCTION get_dusun_from_form_data TO authenticated;