-- Fix storage policies for portrait uploads
-- Allow anonymous users to upload to the portraits bucket

-- Create policy to allow anyone to upload to portraits bucket
CREATE POLICY "Allow anonymous uploads to portraits bucket" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'portraits');

-- Create policy to allow anyone to read from portraits bucket  
CREATE POLICY "Allow public access to portraits bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'portraits');

-- Create policy to allow users to update their own uploads
CREATE POLICY "Allow users to update their portraits" ON storage.objects
  FOR UPDATE USING (bucket_id = 'portraits');

-- Create policy to allow users to delete their own uploads
CREATE POLICY "Allow users to delete their portraits" ON storage.objects
  FOR DELETE USING (bucket_id = 'portraits');