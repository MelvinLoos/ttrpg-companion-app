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
  gm_id: string
  name: string
  portrait_url: string | null
  stats_json: CharacterStats
  created_at: string
  updated_at: string
}

export interface CharacterState {
  premadeCharacters: PremadeCharacter[]
  loading: boolean
  error: string | null
}