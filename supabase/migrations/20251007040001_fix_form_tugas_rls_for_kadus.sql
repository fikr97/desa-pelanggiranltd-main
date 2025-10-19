-- MIGRASI PERBAIKAN: Perbaikan RLS untuk tabel form_tugas agar kadus bisa melihat form sesuai visibilitasnya termasuk mode 'semua_data'

-- Hapus kebijakan lama jika ada
DROP POLICY IF EXISTS "Select policy for form_tugas based on visibility" ON form_tugas;
DROP POLICY IF EXISTS "Insert policy for form_tugas" ON form_tugas;
DROP POLICY IF EXISTS "Update policy for form_tugas" ON form_tugas;
DROP POLICY IF EXISTS "Delete policy for form_tugas" ON form_tugas;

-- Tambahkan kebijakan SELECT untuk form_tugas
CREATE POLICY "Select policy for form_tugas based on visibility"
ON form_tugas FOR SELECT
TO authenticated
USING (
  -- Admin bisa lihat semua form
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  -- Kadus bisa lihat form jika:
  (
    (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'kadus'
    AND 
    (
      -- Jika form dalam mode 'semua_data', semua kadus bisa lihat form ini
      visibilitas_dusun = 'semua_data'
      OR
      -- Jika form dalam mode 'semua', semua kadus bisa lihat
      visibilitas_dusun = 'semua'
      OR
      -- Jika form dalam mode 'tertentu', hanya kadus dari dusun terpilih yang bisa lihat
      (
        visibilitas_dusun = 'tertentu'
        AND (SELECT dusun FROM public.profiles WHERE user_id = auth.uid()) = ANY(
          COALESCE(dusun_terpilih, '{}')
        )
      )
    )
  )
);

-- Tambahkan kebijakan INSERT - hanya admin yang bisa buat form baru
CREATE POLICY "Insert policy for form_tugas"
ON form_tugas FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Tambahkan kebijakan UPDATE - hanya admin yang bisa ubah form (kecuali user yang membuat sendiri)
CREATE POLICY "Update policy for form_tugas"
ON form_tugas FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  created_by = auth.uid()  -- Jika user yang membuat form, maka bisa edit
)
WITH CHECK (
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
  OR
  created_by = auth.uid()  -- Jika user yang membuat form, maka bisa edit
);

-- Tambahkan kebijakan DELETE - hanya admin yang bisa hapus form
CREATE POLICY "Delete policy for form_tugas"
ON form_tugas FOR DELETE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Konfirmasi bahwa RLS aktif
ALTER TABLE form_tugas ENABLE ROW LEVEL SECURITY;