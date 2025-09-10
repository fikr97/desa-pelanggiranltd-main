CREATE POLICY "Admins can create new users"
ON public.profiles
FOR INSERT
WITH CHECK (
  (SELECT role FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);
