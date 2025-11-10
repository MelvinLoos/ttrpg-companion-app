-- Enable real-time for tables that need live updates
-- This allows Supabase real-time subscriptions to receive events

-- Add session_characters table to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE session_characters;

-- Also enable sessions table for real-time (for session updates)
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;

-- Verify the tables are added to publication
-- This is for reference only, not executed
-- SELECT schemaname, tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';