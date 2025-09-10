ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to insert into profiles" ON profiles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
