-- Enable download (read) access to anyone for the portraits bucket
CREATE POLICY "Portraits are publicly accessible" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'portraits');

-- Enable upload (insert) access to authenticated users for the portraits bucket
CREATE POLICY "Authenticated users can upload portraits" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'portraits');

-- Enable delete access to portrait owners
CREATE POLICY "Users can delete their own portraits" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'portraits' AND 
    (auth.uid() IN (
      SELECT gm_id 
      FROM premade_characters 
      WHERE portrait_url LIKE '%' || name || '%'
    ))
  );