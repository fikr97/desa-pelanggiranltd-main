ALTER TABLE penduduk ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to insert into penduduk" ON penduduk
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
