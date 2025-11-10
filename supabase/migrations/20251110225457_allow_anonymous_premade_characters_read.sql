-- Allow anonymous (unauthenticated) users to read premade characters for session joining
-- This is needed so players can select premade characters when joining sessions

-- Drop the existing policy that requires authentication
DROP POLICY IF EXISTS "premade_characters_public_read" ON "public"."premade_characters";

-- Create a new policy that allows all users (authenticated and anonymous) to read premade characters
CREATE POLICY "premade_characters_anonymous_read"
ON "public"."premade_characters"
AS PERMISSIVE
FOR SELECT
TO PUBLIC
USING (true);
