
-- Function to convert month number to Roman numeral
CREATE OR REPLACE FUNCTION to_roman(num integer)
RETURNS text AS $$
DECLARE
  roman_map text[] := ARRAY[
    'M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'
  ];
  val_map integer[] := ARRAY[
    1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1
  ];
  result text := '';
  i integer;
  v integer := num;
BEGIN
  FOR i IN 1..array_length(val_map, 1) LOOP
    WHILE v >= val_map[i] LOOP
      result := result || roman_map[i];
      v := v - val_map[i];
    END LOOP;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update generate_nomor_surat function to include Roman month
CREATE OR REPLACE FUNCTION public.generate_nomor_surat(template_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
DECLARE
  template_rec RECORD;
  nomor_result TEXT;
  current_year TEXT;
  current_month_roman TEXT;
  next_indeks INTEGER;
BEGIN
  -- Ambil data template
  SELECT * INTO template_rec FROM public.surat_template WHERE id = template_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template tidak ditemukan';
  END IF;
  
  -- Dapatkan tahun dan bulan saat ini
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  current_month_roman := to_roman(EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER);
  
  -- Hitung nomor urut berikutnya untuk template ini di tahun ini
  SELECT COALESCE(MAX(
    CASE 
      WHEN SPLIT_PART(nomor_surat, '/', 2) ~ '^[0-9]+$' 
      THEN CAST(SPLIT_PART(nomor_surat, '/', 2) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_indeks
  FROM public.surat 
  WHERE template_id = template_id_param 
    AND EXTRACT(YEAR FROM tanggal_surat) = EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Generate nomor surat berdasarkan format template
  -- Default format jika tidak ada: '[indeks_no]/[no]/[kode]/[kode_desa]/[bulan_romawi]/[tahun]'
  nomor_result := COALESCE(template_rec.format_nomor_surat, '[indeks_no]/[no]/[kode]/[kode_desa]/[bulan_romawi]/[tahun]');
  
  nomor_result := REPLACE(nomor_result, '[indeks_no]', template_rec.indeks_nomor::TEXT);
  nomor_result := REPLACE(nomor_result, '[no]', LPAD(next_indeks::TEXT, 3, '0'));
  nomor_result := REPLACE(nomor_result, '[kode]', template_rec.kode_surat);
  nomor_result := REPLACE(nomor_result, '[kode_desa]', template_rec.kode_desa);
  nomor_result := REPLACE(nomor_result, '[bulan_romawi]', current_month_roman);
  nomor_result := REPLACE(nomor_result, '[tahun]', current_year);
  
  RETURN nomor_result;
END;
$function$;
