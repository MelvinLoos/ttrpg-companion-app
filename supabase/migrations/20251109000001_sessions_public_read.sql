-- Add public read access for sessions so players can join
-- Players need to read basic session info (name, teaser_text) to join

-- Add public read policy for sessions
CREATE POLICY "sessions_public_read"
ON "public"."sessions"
AS PERMISSIVE
FOR SELECT
TO public
USING (true);