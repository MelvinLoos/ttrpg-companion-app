export interface GameSession {
  id: string
  gm_id: string
  name: string
  showing: 'lobby' | 'combat'
  state: 'LOBBY' | 'IN_PLAY' | 'PAUSED'
  active_image_url: string | null
  teaser_text: string | null
  active_turn_character_id: string | null
  created_at: string
  updated_at: string
}

export interface SessionCharacter {
  id: string
  session_id: string
  name: string
  portrait_url: string | null
  is_premade: boolean
  character_type: 'player' | 'npc' | 'monster'
  initiative_modifier: number
  initiative_roll: number | null
  hand_raised: boolean
  created_at: string
  updated_at: string
}

export interface SessionState {
  sessions: GameSession[]
  currentSession: GameSession | null
  characters: Record<string, SessionCharacter[]> // Keyed by session_id
  loading: boolean
  error: string | null
}