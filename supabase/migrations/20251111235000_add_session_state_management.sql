-- Add session state management column
-- Part of Feature 1: Session State Management

-- Add state column with CHECK constraint
ALTER TABLE public.sessions 
ADD COLUMN state text DEFAULT 'LOBBY' NOT NULL;

-- Add CHECK constraint to ensure only valid states
ALTER TABLE public.sessions 
ADD CONSTRAINT sessions_state_check 
CHECK (state IN ('LOBBY', 'IN_PLAY', 'PAUSED'));

-- Update RLS policy to allow reading state by anyone (needed for player views)
-- This extends existing public read policy to include the state column

-- Create index for efficient state filtering
CREATE INDEX IF NOT EXISTS idx_sessions_state ON public.sessions USING btree (state);