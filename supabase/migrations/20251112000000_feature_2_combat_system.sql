-- Feature 2: Combat Tracker Database Schema
-- Implements Issues #23-26 for combat management system

-- Monster Templates Table
-- Stores reusable monster definitions
CREATE TABLE IF NOT EXISTS public.monster_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    hit_points INTEGER NOT NULL CHECK (hit_points > 0),
    armor_class INTEGER NOT NULL CHECK (armor_class > 0),
    challenge_rating TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Combat Encounters Table
-- Prepared encounters with multiple monsters
CREATE TABLE IF NOT EXISTS public.combat_encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Combat Encounter Monsters Table
-- Junction table linking encounters to monster templates with quantities
CREATE TABLE IF NOT EXISTS public.combat_encounter_monsters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES public.combat_encounters(id) ON DELETE CASCADE,
    monster_template_id UUID NOT NULL REFERENCES public.monster_templates(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Active Combats Table
-- Tracks live combat sessions
CREATE TABLE IF NOT EXISTS public.active_combats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES public.combat_encounters(id),
    current_turn_id UUID,
    round_number INTEGER NOT NULL DEFAULT 1 CHECK (round_number > 0),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Ensure only one active combat per session
    UNIQUE(session_id)
);

-- Combat Participants Table
-- Individual participants in active combats (players + monster instances)
CREATE TABLE IF NOT EXISTS public.combat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    active_combat_id UUID NOT NULL REFERENCES public.active_combats(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    initiative INTEGER CHECK (initiative >= 0),
    
    -- Player participant fields
    character_id UUID REFERENCES public.session_characters(id) ON DELETE CASCADE,
    
    -- Monster participant fields
    monster_template_id UUID REFERENCES public.monster_templates(id),
    current_hit_points INTEGER,
    max_hit_points INTEGER,
    monster_instance_name TEXT, -- "Goblin 1", "Goblin 2", etc.
    
    -- Track turn order
    turn_order INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure participant is either a character OR a monster
    CHECK (
        (character_id IS NOT NULL AND monster_template_id IS NULL) OR
        (character_id IS NULL AND monster_template_id IS NOT NULL)
    )
);

-- Add foreign key constraint for current_turn_id after creating combat_participants
ALTER TABLE public.active_combats 
ADD CONSTRAINT fk_current_turn 
FOREIGN KEY (current_turn_id) REFERENCES public.combat_participants(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_combat_encounter_monsters_encounter ON public.combat_encounter_monsters(encounter_id);
CREATE INDEX IF NOT EXISTS idx_combat_encounter_monsters_template ON public.combat_encounter_monsters(monster_template_id);
CREATE INDEX IF NOT EXISTS idx_active_combats_session ON public.active_combats(session_id);
CREATE INDEX IF NOT EXISTS idx_combat_participants_combat ON public.combat_participants(active_combat_id);
CREATE INDEX IF NOT EXISTS idx_combat_participants_initiative ON public.combat_participants(active_combat_id, initiative DESC);
CREATE INDEX IF NOT EXISTS idx_combat_participants_turn_order ON public.combat_participants(active_combat_id, turn_order);

-- Row Level Security (RLS) Policies

-- Monster Templates: Public read access
ALTER TABLE public.monster_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for monster templates" ON public.monster_templates
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users can modify monster templates" ON public.monster_templates
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Combat Encounters: Public read access
ALTER TABLE public.combat_encounters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for combat encounters" ON public.combat_encounters
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users can modify combat encounters" ON public.combat_encounters
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Combat Encounter Monsters: Public read access
ALTER TABLE public.combat_encounter_monsters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for combat encounter monsters" ON public.combat_encounter_monsters
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users can modify combat encounter monsters" ON public.combat_encounter_monsters
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Active Combats: Public read access
ALTER TABLE public.active_combats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for active combats" ON public.active_combats
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users can modify active combats" ON public.active_combats
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Combat Participants: Public read access
ALTER TABLE public.combat_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for combat participants" ON public.combat_participants
    FOR SELECT USING (true);
CREATE POLICY "Authenticated users can modify combat participants" ON public.combat_participants
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Enable Realtime for combat tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.monster_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.combat_encounters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.combat_encounter_monsters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.active_combats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.combat_participants;

-- Insert some sample monster templates for testing
INSERT INTO public.monster_templates (name, hit_points, armor_class, challenge_rating, description) VALUES
('Goblin', 7, 15, '1/4', 'Small humanoid, neutral evil'),
('Orc', 15, 13, '1/2', 'Medium humanoid, chaotic evil'),
('Skeleton', 13, 13, '1/4', 'Medium undead, lawful evil'),
('Zombie', 22, 8, '1/4', 'Medium undead, neutral evil'),
('Hobgoblin', 11, 18, '1/2', 'Medium humanoid, lawful evil');

-- Insert a sample combat encounter
INSERT INTO public.combat_encounters (id, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Goblin Ambush', 'A group of goblins attack the party on the forest road');

-- Link monsters to the sample encounter
INSERT INTO public.combat_encounter_monsters (encounter_id, monster_template_id, quantity)
SELECT 
    '550e8400-e29b-41d4-a716-446655440000',
    mt.id,
    CASE 
        WHEN mt.name = 'Goblin' THEN 3
        WHEN mt.name = 'Hobgoblin' THEN 1
        ELSE 1
    END
FROM public.monster_templates mt
WHERE mt.name IN ('Goblin', 'Hobgoblin');