-- Security fix (Supabase advisor: policy_exists_rls_disabled,
-- rls_disabled_in_public, sensitive_columns_exposed)
--
-- Restore Row Level Security on the core public tables.
--
-- RLS was enabled on these tables at creation time in:
--   20251022235045_init_schema.sql          (sessions, session_characters,
--                                            premade_characters)
--   20251112000000_feature_2_combat_system.sql (monster_templates,
--                                            combat_encounters,
--                                            combat_encounter_monsters,
--                                            active_combats,
--                                            combat_participants)
--
-- It was later disabled out-of-band (manually in the dashboard / ad-hoc SQL)
-- and never re-enabled, which left these public tables exposed via the
-- PostgREST API without RLS protection.
--
-- The full policy set for each table already exists in earlier migrations,
-- and the application only performs access patterns that those policies allow
-- (see src/stores/{session,character,combat,asset}.ts), so re-enabling RLS is
-- safe and requires no application code changes.
--
-- Note: ENABLE (not FORCE) is used for consistency with prior migrations and
-- to preserve the service_role BYPASSRLS behavior used by admin flows.

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premade_characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monster_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combat_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combat_encounter_monsters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_combats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combat_participants ENABLE ROW LEVEL SECURITY;
