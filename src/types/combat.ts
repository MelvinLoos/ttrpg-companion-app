// Combat System Types
// Corresponds to database schema from 20251112000000_feature_2_combat_system.sql

export interface MonsterTemplate {
  id: string;
  name: string;
  hit_points: number;
  armor_class: number;
  challenge_rating: string | null;
  description: string | null;
  created_at: string;
}

export interface CombatEncounter {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface CombatEncounterMonster {
  id: string;
  encounter_id: string;
  monster_template_id: string;
  quantity: number;
  created_at: string;
  // Joined data
  monster_template?: MonsterTemplate;
}

export interface ActiveCombat {
  id: string;
  session_id: string;
  encounter_id: string | null;
  current_turn_id: string | null;
  round_number: number;
  started_at: string;
  ended_at: string | null;
  // Joined data
  encounter?: CombatEncounter;
}

export interface CombatParticipant {
  id: string;
  active_combat_id: string;
  name: string;
  initiative: number | null;
  
  // Player fields
  character_id: string | null;
  
  // Monster fields
  monster_template_id: string | null;
  current_hit_points: number | null;
  max_hit_points: number | null;
  monster_instance_name: string | null;
  
  // Turn tracking
  turn_order: number | null;
  created_at: string;
  
  // Joined data
  monster_template?: MonsterTemplate;
  character?: {
    id: string;
    name: string;
  };
}

// Helper types for combat management
export type ParticipantType = 'player' | 'monster';

export interface CombatParticipantWithType extends CombatParticipant {
  type: ParticipantType;
  health_status?: 'Unharmed' | 'Injured' | 'Bloodied' | 'Near Death' | 'Defeated';
  health_percentage?: number;
}

export interface CreateCombatParticipantData {
  active_combat_id: string;
  name: string;
  initiative?: number;
  character_id?: string;
  monster_template_id?: string;
  current_hit_points?: number;
  max_hit_points?: number;
  monster_instance_name?: string;
  turn_order?: number;
}

export interface CombatEncounterWithMonsters extends CombatEncounter {
  monsters: CombatEncounterMonster[];
}

export interface ActiveCombatWithParticipants extends ActiveCombat {
  participants: CombatParticipantWithType[];
}

// Combat state management
export interface CombatState {
  activeCombat: ActiveCombat | null;
  participants: CombatParticipantWithType[];
  isLoading: boolean;
  error: string | null;
}

// UI-specific types
export interface InitiativeEntry {
  participantId: string;
  initiative: number;
}

export interface HealthUpdate {
  participantId: string;
  currentHitPoints: number;
  maxHitPoints: number;
}