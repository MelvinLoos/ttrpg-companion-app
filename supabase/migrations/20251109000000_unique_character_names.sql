-- Add unique constraint for character names within a session
-- This ensures no duplicate character names in the same session

-- Create unique index for session_id + name combination
CREATE UNIQUE INDEX IF NOT EXISTS session_characters_session_name_unique 
ON public.session_characters(session_id, name);