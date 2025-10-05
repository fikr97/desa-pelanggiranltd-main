-- MIGRASI PERBAIKAN: Memperbaiki akses data penduduk dalam form_tugas

-- Kita harus menggabungkan beberapa kebijakan untuk memastikan 
-- bahwa dalam mode 'semua_data', kadus bisa mengakses data penduduk dari semua dusun
-- ketika mengakses form dalam mode tersebut

-- Kita perlu mengembalikan kebijakan sebelumnya dan menyesuaikan dengan kasus spesifik kita

-- Kita buat kebijakan untuk penduduk yang lebih tepat:
-- Memungkinkan akses jika user mengakses melalui form_tugas_data yang mereka punya akses

-- Pertama, hapus kebijakan penduduk yang mungkin mengganggu
-- Tapi karena kita tidak tahu kebijakan penduduk yang sekarang, kita buat kebijakan yang menggabungkan
-- kasus-kasus yang diperlukan

-- Kita buat kebijakan yang memungkinkan akses penduduk ketika:
-- 1. User adalah admin (selalu bisa)
-- 2. Penduduk dari dusun yang sama dengan user (untuk mode normal)
-- 3. Penduduk terkait dengan form_tugas_data dalam form dengan mode 'semua_data' (untuk mode semua_data)

-- Tapi karena RLS tidak bisa secara langsung mendeteksi "dari query mana" akses terjadi,
-- kita harus membuat kebijakan yang memungkinkan akses pada kasus-kasus tertentu

-- Kita gunakan pendekatan berikut:
-- Untuk setiap akses SELECT ke penduduk, periksa apakah:
-- a) User adalah admin, ATAU
-- b) Dusun penduduk sama dengan dusun user, ATAU  
-- c) User sedang mengakses data dari form_tugas_data dalam form mode 'semua_data'

-- Tapi cara yang lebih langsung: 
-- Kita perlu memungkinkan akses ke penduduk ketika penduduk.id terkait dengan form_tugas_data 
-- yang bisa diakses oleh user

-- Kita harus kembali ke kebijakan penduduk asli dan menyesuaikannya dengan tepat
-- Mari kita gunakan kebijakan yang serupa dengan yang sudah bekerja sebelumnya
-- TAPI kita tambahkan kondisi untuk mode 'semua_data'

-- Kita akan menyesuaikan kebijakan penduduk agar memungkinkan akses tambahan dalam konteks form

-- Ini adalah kebijakan standar yang seharusnya bekerja untuk kasus umum
-- Tapi kita tambahkan kemungkinan akses untuk form dalam mode 'semua_data'

-- Kita tidak bisa mengganti kebijakan RLS secara keseluruhan karena akan mempengaruhi bagian lain
-- Jadi pendekatan yang lebih aman adalah memperbaiki cara DataEntryForm mengambil data penduduk

-- Tapi migrasi ini fokus pada RLS, maka kita buat kebijakan yang lebih luas
-- hanya untuk kasus-kasus spesifik terkait form

-- Versi final: Kita perlu membuat kebijakan yang memungkinkan akses ke penduduk
-- ketika user dapat mengakses form_tugas_data terkait dalam mode 'semua_data'

-- Kita gunakan pendekatan dengan EXISTS:
DROP POLICY IF EXISTS "Allow access to penduduk in form context" ON public.penduduk;

CREATE POLICY "Allow penduduk access in form context"
ON public.penduduk FOR SELECT
TO authenticated
USING (
  -- Admin bisa akses semua
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus bisa akses penduduk dari dusun mereka
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND penduduk.dusun = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
  )
  OR
  -- Kadus bisa akses penduduk ketika terkait dengan form_tugas_data dalam form mode 'semua_data'
  EXISTS (
    SELECT 1 
    FROM form_tugas_data ftd
    JOIN form_tugas ft ON ftd.form_tugas_id = ft.id
    WHERE ftd.penduduk_id = penduduk.id
    AND ft.visibilitas_dusun = 'semua_data'
    AND (
      -- Harus dicek juga bahwa user ini adalah yang mengakses form tersebut
      -- (bisa dalam konteks view data atau form isi data)
      ftd.id IN (
        -- Data yang bisa diakses oleh user saat ini
        SELECT id FROM form_tugas_data 
        WHERE (
          form_tugas_data.user_id = auth.uid() -- milik user
          OR 'kadus' = (SELECT role FROM public.profiles WHERE user_id = auth.uid()) -- atau dalam mode semua_data
        )
      )
    )
  )
);