export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      premade_characters: {
        Row: {
          created_at: string
          gm_id: string | null
          id: string
          name: string
          portrait_url: string | null
          stats_json: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          gm_id?: string | null
          id?: string
          name: string
          portrait_url?: string | null
          stats_json?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          gm_id?: string | null
          id?: string
          name?: string
          portrait_url?: string | null
          stats_json?: Json | null
          updated_at?: string
        }
      }
      session_assets: {
        Row: {
          asset_type: string
          created_at: string
          friendly_name: string | null
          gm_id: string | null
          id: string
          public_url: string | null
          storage_bucket: string
          storage_path: string
        }
        Insert: {
          asset_type: string
          created_at?: string
          friendly_name?: string | null
          gm_id?: string | null
          id?: string
          public_url?: string | null
          storage_bucket: string
          storage_path: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          friendly_name?: string | null
          gm_id?: string | null
          id?: string
          public_url?: string | null
          storage_bucket?: string
          storage_path?: string
        }
      }
      session_characters: {
        Row: {
          character_type: string | null
          created_at: string
          hand_raised: boolean | null
          id: string
          initiative_modifier: number | null
          initiative_roll: number | null
          is_premade: boolean | null
          name: string
          portrait_url: string | null
          session_id: string | null
          updated_at: string
        }
        Insert: {
          character_type?: string | null
          created_at?: string
          hand_raised?: boolean | null
          id?: string
          initiative_modifier?: number | null
          initiative_roll?: number | null
          is_premade?: boolean | null
          name: string
          portrait_url?: string | null
          session_id?: string | null
          updated_at?: string
        }
        Update: {
          character_type?: string | null
          created_at?: string
          hand_raised?: boolean | null
          id?: string
          initiative_modifier?: number | null
          initiative_roll?: number | null
          is_premade?: boolean | null
          name?: string
          portrait_url?: string | null
          session_id?: string | null
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          active_image_url: string | null
          active_turn_character_id: string | null
          created_at: string
          gm_id: string | null
          id: string
          name: string
          showing: string
          teaser_text: string | null
          updated_at: string
        }
        Insert: {
          active_image_url?: string | null
          active_turn_character_id?: string | null
          created_at?: string
          gm_id?: string | null
          id?: string
          name: string
          showing?: string
          teaser_text?: string | null
          updated_at?: string
        }
        Update: {
          active_image_url?: string | null
          active_turn_character_id?: string | null
          created_at?: string
          gm_id?: string | null
          id?: string
          name?: string
          showing?: string
          teaser_text?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}