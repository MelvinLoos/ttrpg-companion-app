-- Fix the unique constraint on active_combats to only apply to non-ended combats
-- The current constraint prevents any new combat creation if ANY combat exists for a session
-- We need to allow multiple combats per session, but only one ACTIVE (ended_at IS NULL) combat

-- Drop the existing unique constraint
ALTER TABLE public.active_combats 
DROP CONSTRAINT IF EXISTS active_combats_session_id_key;

-- Create a partial unique index that only applies to active (non-ended) combats
CREATE UNIQUE INDEX IF NOT EXISTS idx_active_combats_session_active 
ON public.active_combats(session_id) 
WHERE ended_at IS NULL;

-- Add a comment to explain the constraint
COMMENT ON INDEX idx_active_combats_session_active IS 
'Ensures only one active (non-ended) combat per session at a time';