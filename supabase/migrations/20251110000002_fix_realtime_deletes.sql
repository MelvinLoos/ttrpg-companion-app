-- Ensure all events (INSERT, UPDATE, DELETE) are published for real-time
-- Sometimes DELETE events need explicit configuration

-- Ensure replica identity is set for DELETE events to work
-- This is crucial for DELETE events to include the deleted record data
ALTER TABLE session_characters REPLICA IDENTITY FULL;
ALTER TABLE sessions REPLICA IDENTITY FULL;