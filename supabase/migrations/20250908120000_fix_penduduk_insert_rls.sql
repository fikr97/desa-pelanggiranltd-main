-- Drop the old, problematic policy
DROP POLICY "Allow authenticated users to insert into penduduk" ON public.penduduk;

-- Create a new, more specific policy that allows admins or Kadus to insert residents
CREATE POLICY "Allow admin or kadus to insert penduduk"
ON public.penduduk
FOR INSERT
WITH CHECK (
  (get_current_user_role() IN ('admin', 'kadus'))
);
