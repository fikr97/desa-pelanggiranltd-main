-- Fix the generate_nomor_surat function to properly handle sequential numbering
CREATE OR REPLACE FUNCTION public.generate_nomor_surat(template_id_param uuid)
RETURNS text
LANGUAGE plpgsql
AS $function$
DECLARE
  template_rec RECORD;
  nomor_result TEXT;
  current_year TEXT;
  next_indeks INTEGER;
BEGIN
  -- Ambil data template
  SELECT * INTO template_rec FROM public.surat_template WHERE id = template_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template tidak ditemukan';
  END IF;
  
  -- Dapatkan tahun saat ini
  current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  -- Hitung nomor urut berikutnya untuk template ini di tahun ini
  -- Format biasanya: [indeks_no]/[no]/[kode]/[kode_desa]/[tahun]
  -- Jadi kita ambil bagian kedua (setelah '/' pertama) sebagai sequential number
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
  nomor_result := template_rec.format_nomor_surat;
  nomor_result := REPLACE(nomor_result, '[indeks_no]', template_rec.indeks_nomor::TEXT);
  nomor_result := REPLACE(nomor_result, '[no]', LPAD(next_indeks::TEXT, 3, '0')); -- Format dengan leading zeros (001, 002, etc)
  nomor_result := REPLACE(nomor_result, '[kode]', template_rec.kode_surat);
  nomor_result := REPLACE(nomor_result, '[kode_desa]', template_rec.kode_desa);
  nomor_result := REPLACE(nomor_result, '[tahun]', current_year);
  
  RETURN nomor_result;
END;
$function$