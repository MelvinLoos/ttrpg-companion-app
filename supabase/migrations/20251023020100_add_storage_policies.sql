-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('portraits', 'portraits', true),
  ('scenes', 'scenes', true),
  ('maps', 'maps', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Enable download (read) access to anyone for all asset buckets
CREATE POLICY "Assets are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('portraits', 'scenes', 'maps'));

-- Enable upload (insert) access to authenticated users for all asset buckets
CREATE POLICY "Authenticated users can upload assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('portraits', 'scenes', 'maps'));

-- Enable delete access to asset owners
CREATE POLICY "Users can delete their own assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('portraits', 'scenes', 'maps') AND
  auth.uid() IN (
    SELECT gm_id
    FROM session_assets
    WHERE storage_bucket = bucket_id
    AND storage_path = name
  )
);