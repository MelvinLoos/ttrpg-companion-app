-- Migration: Fix cascade and nullify on combat foreign keys

-- Drop and recreate combat_participants.character_id FK with ON DELETE CASCADE
ALTER TABLE combat_participants DROP CONSTRAINT IF EXISTS fk_character_id;
ALTER TABLE combat_participants
  ADD CONSTRAINT fk_character_id
  FOREIGN KEY (character_id)
  REFERENCES session_characters(id)
  ON DELETE CASCADE;

-- Drop and recreate active_combats.current_turn_id FK with ON DELETE SET NULL
ALTER TABLE active_combats DROP CONSTRAINT IF EXISTS fk_current_turn;
ALTER TABLE active_combats
  ADD CONSTRAINT fk_current_turn
  FOREIGN KEY (current_turn_id)
  REFERENCES combat_participants(id)
  ON DELETE SET NULL;
