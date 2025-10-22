CREATE TABLE public.premade_characters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  gm_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  portrait_url text,
  stats_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.session_characters (
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

CREATE INDEX idx_premade_gm_id ON public.premade_characters (gm_id);
CREATE INDEX idx_session_characters_session_id ON public.session_characters (session_id);