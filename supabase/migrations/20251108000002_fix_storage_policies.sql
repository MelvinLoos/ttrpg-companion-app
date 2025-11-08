-- Fix storage policies - remove circular dependency
DROP POLICY IF EXISTS "Authenticated users can upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own assets" ON storage.objects;

-- Simpler upload policy - just check authentication and bucket
CREATE POLICY "Authenticated users can upload assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('portraits', 'scenes', 'maps'));

-- Simpler delete policy - allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('portraits', 'scenes', 'maps') AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Alternative: Allow any authenticated user to delete from these buckets (less secure but simpler)
-- CREATE POLICY "Users can delete assets"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id IN ('portraits', 'scenes', 'maps'));