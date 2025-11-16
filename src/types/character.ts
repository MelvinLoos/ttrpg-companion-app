import type { Json } from './supabase'

export interface CharacterStats {
  STR: number
  DEX: number
  CON: number
  INT: number
  WIS: number
  CHA: number
}

export interface PremadeCharacter {
  id: string
  gm_id: string | null;
  name: string
  portrait_url: string | null
  stats_json: CharacterStats | Json | null
  created_at: string | null
  updated_at: string | null
}

export interface CharacterState {
  // TypeScript deep type instantiation workaround: use any[]
  premadeCharacters: any[]
  loading: boolean
  error: string | null
}