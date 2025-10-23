-- Enable RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premade_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_assets ENABLE ROW LEVEL SECURITY;

-- Session policies
DROP POLICY IF EXISTS "sessions_owner" ON public.sessions;

CREATE POLICY "sessions_owner_read" ON public.sessions
  FOR SELECT USING (gm_id = auth.uid());

CREATE POLICY "sessions_owner_insert" ON public.sessions
  FOR INSERT WITH CHECK (gm_id = auth.uid());

CREATE POLICY "sessions_owner_update" ON public.sessions
  FOR UPDATE USING (gm_id = auth.uid())
  WITH CHECK (gm_id = auth.uid());

CREATE POLICY "sessions_owner_delete" ON public.sessions
  FOR DELETE USING (gm_id = auth.uid());

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