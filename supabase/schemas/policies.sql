-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premade_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_assets ENABLE ROW LEVEL SECURITY;

-- Session policies
CREATE POLICY "sessions_owner" ON public.sessions
  FOR ALL USING (gm_id = auth.uid());

-- Character policies
CREATE POLICY "characters_owner" ON public.premade_characters
  FOR ALL USING (gm_id = auth.uid());

CREATE POLICY "session_characters_public_read" ON public.session_characters
  FOR SELECT USING (true);

CREATE POLICY "session_characters_owner_write" ON public.session_characters
  FOR INSERT WITH CHECK (true);

-- Asset policies
CREATE POLICY "assets_public_read" ON public.session_assets
  FOR SELECT USING (true);

CREATE POLICY "assets_owner_write" ON public.session_assets
  FOR ALL USING (gm_id = auth.uid())
  WITH CHECK (gm_id = auth.uid());