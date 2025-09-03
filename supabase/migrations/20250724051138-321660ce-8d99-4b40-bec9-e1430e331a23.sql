-- Update handle_new_user function to handle dusun and role from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nama, email, dusun, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'nama', NEW.email), 
    NEW.email,
    NEW.raw_user_meta_data->>'dusun',
    COALESCE(NEW.raw_user_meta_data->>'role', 'kadus')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';