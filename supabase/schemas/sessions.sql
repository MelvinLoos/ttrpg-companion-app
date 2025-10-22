CREATE TABLE public.sessions (
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

CREATE INDEX idx_sessions_gm_id ON public.sessions (gm_id);