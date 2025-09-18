-- Add RLS policies for Update and Delete on arsip_surat_keluar for authenticated users

CREATE POLICY "Allow authenticated users to update arsip_surat_keluar"
ON public.arsip_surat_keluar
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete arsip_surat_keluar"
ON public.arsip_surat_keluar
FOR DELETE
TO authenticated
USING (true);
