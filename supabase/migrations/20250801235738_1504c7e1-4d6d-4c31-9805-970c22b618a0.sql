-- Fix function search paths for security linter warnings
-- Update all functions to have proper search_path settings

-- Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, nama, email, dusun, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email), 
    NEW.email,
    NEW.raw_user_meta_data->>'dusun',
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$function$;

-- Fix update_wilayah_statistics function
CREATE OR REPLACE FUNCTION public.update_wilayah_statistics()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $function$
BEGIN
    -- Update jumlah KK dan penduduk untuk dusun yang terpengaruh
    UPDATE wilayah 
    SET 
        jumlah_kk = (
            SELECT COUNT(DISTINCT no_kk) 
            FROM penduduk 
            WHERE dusun = wilayah.nama 
            AND no_kk IS NOT NULL 
            AND no_kk != ''
        ),
        jumlah_penduduk = (
            SELECT COUNT(*) 
            FROM penduduk 
            WHERE dusun = wilayah.nama
        ),
        updated_at = NOW()
    WHERE nama IN (
        COALESCE(NEW.dusun, ''), 
        COALESCE(OLD.dusun, '')
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Fix get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$function$;

-- Fix get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE user_id = user_uuid LIMIT 1);
END;
$function$;

-- Fix is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE user_id = user_uuid LIMIT 1) = 'admin';
END;
$function$;

-- Fix generate_nomor_surat function
CREATE OR REPLACE FUNCTION public.generate_nomor_surat(template_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = 'public'
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
$function$;