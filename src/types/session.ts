export interface GameSession {
  id: string
  gm_id: string
  name: string
  showing: 'lobby' | 'combat'
  state: 'LOBBY' | 'IN_PLAY' | 'PAUSED'
  active_image_url: string | null
  current_image_asset_id?: string | null // Optional for backward compatibility during migration
  teaser_text: string | null
  active_turn_character_id: string | null
  created_at: string
  updated_at: string
}

export interface SessionCharacter {
  id: string
  session_id: string | null
  name: string
  portrait_url: string | null
  is_premade: boolean | null
  character_type: string | null
  initiative_modifier: number | null
  initiative_roll: number | null
  hand_raised: boolean | null
  created_at: string | null
  updated_at: string | null
}

export interface SessionAsset {
  id: string
  gm_id: string
  asset_type: 'portrait' | 'scene' | 'map'
  type: 'IMAGE' | 'AUDIO'
  storage_bucket: 'portraits' | 'scenes' | 'maps'
  storage_path: string
  public_url: string | null
  friendly_name: string | null
  created_at: string
}

export interface SessionState {
  sessions: GameSession[]
  currentSession: GameSession | null
  characters: Record<string, SessionCharacter[]> // Keyed by session_id
  loading: boolean
  error: string | null
}