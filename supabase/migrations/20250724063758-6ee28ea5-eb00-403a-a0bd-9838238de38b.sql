-- Update handle_new_user function to set default role as 'user' for public signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update profiles table to include 'user' role option
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'kadus', 'user'));