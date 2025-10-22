-- 0001_init.sql
-- Initial schema for TTRPG Companion App
-- Creates: sessions, premade_characters, session_characters, session_assets

BEGIN;

-- enable uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  gm_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  showing text NOT NULL DEFAULT 'lobby',
  active_image_url text,
  teaser_text text,
  active_turn_character_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- premade_characters table
CREATE TABLE IF NOT EXISTS public.premade_characters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  gm_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  portrait_url text,
  stats_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- session_characters table
CREATE TABLE IF NOT EXISTS public.session_characters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  name text NOT NULL,
  portrait_url text,
  is_premade boolean DEFAULT false,
  character_type text DEFAULT 'player',
  initiative_modifier integer DEFAULT 0,
  initiative_roll integer,
  hand_raised boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- session_assets table
CREATE TABLE IF NOT EXISTS public.session_assets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  gm_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type text NOT NULL,
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  public_url text,
  friendly_name text,
  created_at timestamptz DEFAULT now()
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_sessions_gm_id ON public.sessions (gm_id);
CREATE INDEX IF NOT EXISTS idx_premade_gm_id ON public.premade_characters (gm_id);
CREATE INDEX IF NOT EXISTS idx_session_characters_session_id ON public.session_characters (session_id);

-- Triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER touch_sessions_updated_at
BEFORE UPDATE ON public.sessions
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER touch_premade_updated_at
BEFORE UPDATE ON public.premade_characters
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER touch_session_characters_updated_at
BEFORE UPDATE ON public.session_characters
FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

COMMIT;

-- RLS policy examples (apply after enabling RLS)
-- ENABLE ROW LEVEL SECURITY for tables and then add policies like:
--
-- ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "sessions_owner" ON public.sessions
--   USING (gm_id = auth.uid())
--   WITH CHECK (gm_id = auth.uid());
--
-- ALTER TABLE public.session_assets ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "assets_public_read" ON public.session_assets
--   FOR SELECT USING (true); -- public read for assets
-- CREATE POLICY "assets_gm_write" ON public.session_assets
--   USING (gm_id = auth.uid())
--   WITH CHECK (gm_id = auth.uid());
