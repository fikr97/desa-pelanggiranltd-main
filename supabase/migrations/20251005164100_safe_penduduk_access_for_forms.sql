-- MIGRASI PERBAIKAN: Perluas akses penduduk untuk form_tugas (Versi Aman)

-- Kita tidak akan mengubah RLS untuk tabel penduduk secara global
-- Karena ini akan mempengaruhi fitur lain di luar form_tugas
-- Sebagai gantinya, kita perlu memastikan bahwa saat form diakses dalam mode 'semua_data',
-- maka data penduduk bisa diakses.

-- Pendekatan terbaik: Kita buat kebijakan yang lebih permisif untuk penduduk
-- TAPI hanya untuk data yang terkait dengan form_tugas_data dalam mode 'semua_data'

-- Hapus kebijakan sebelumnya
DROP POLICY IF EXISTS "Allow access to penduduk based on context" ON public.penduduk;
DROP FUNCTION IF EXISTS can_access_penduduk(UUID);

-- Jika kita sebelumnya memiliki kebijakan RLS untuk penduduk, kita perlu menyesuaikan
-- Tapi berdasarkan diskusi sebelumnya, sepertinya kebijakan RLS untuk penduduk 
-- sudah ditangani di migrasi sebelumnya untuk pembatasan kadus

-- Kita akan membuat kebijakan yang mengizinkan akses ke data penduduk 
-- ketika pengguna adalah admin ATAU ketika dalam konteks form_tugas dengan mode 'semua_data'

-- Tapi karena kita tidak bisa dengan mudah mendeteksi konteks, kita gunakan pendekatan berikut:
-- Kita hanya akan mengizinkan kadus untuk melihat SEMUA penduduk ketika mereka mengakses form dalam mode 'semua_data'
-- Ini agak kompleks, jadi pendekatan yang lebih aman adalah memperlebar akses untuk form_tugas_data

-- Kita akan memperbarui kebijakan untuk penduduk agar memungkinkan akses dalam konteks form_tugas
-- Tapi kita harus berhati-hati agar tidak menciptakan celah keamanan

-- Kita gunakan pendekatan berikut: 
-- Kadus bisa mengakses penduduk dari semua dusun ketika mereka mengakses form_tugas_data 
-- yang terkait dengan form yang diset ke mode 'semua_data'
-- Kita perlu memperhatikan jalur join yang digunakan di form

-- Kita perlu mengembalikan kebijakan penduduk ke versi yang memungkinkan akses dalam konteks form
-- Jadi, kita hanya fokus untuk memperbarui kebijakan penduduk agar memungkinkan form untuk mengambil data penduduk

-- Kita buat kebijakan baru yang lebih luas untuk penduduk (hanya untuk SELECT dari form context)
-- Tapi ini harus dilakukan dengan sangat hati-hati

-- Versi yang aman: Izinkan penduduk untuk diakses ketika terkait dengan form_tugas_data yang dapat diakses oleh user
-- Artinya: jika user bisa mengakses form_tugas_data, maka dia bisa mengakses penduduk terkait
CREATE OR REPLACE POLICY "Allow penduduk access when related to accessible form data"
ON public.penduduk FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus bisa lihat penduduk dari dusun mereka
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND penduduk.dusun = (SELECT dusun FROM public.profiles WHERE user_id = auth.uid())
  )
  OR
  -- Kadus bisa lihat penduduk yang terkait dengan form_tugas_data yang bisa mereka akses
  -- Dalam mode 'semua_data', kadus bisa akses semua data penduduk
  EXISTS (
    SELECT 1 
    FROM form_tugas_data ftd 
    JOIN form_tugas ft ON ftd.form_tugas_id = ft.id
    WHERE ftd.penduduk_id = penduduk.id
    AND (
      -- Jika form dalam mode 'semua_data', dan user adalah kadus
      (ft.visibilitas_dusun = 'semua_data' AND (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus')
    )
  )
);

-- Ini berarti jika seorang kadus mengakses form_tugas_data dalam form dengan mode 'semua_data',
-- mereka akan bisa mengakses data penduduk terkait melalui join.