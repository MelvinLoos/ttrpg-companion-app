export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          gm_id: string;
          name: string;
          showing: "lobby" | "combat";
          state: "LOBBY" | "IN_PLAY" | "PAUSED";
          active_image_url: string | null;
          teaser_text: string | null;
          active_turn_character_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gm_id: string;
          name: string;
          showing?: "lobby" | "combat";
          state?: "LOBBY" | "IN_PLAY" | "PAUSED";
          active_image_url?: string | null;
          teaser_text?: string | null;
          active_turn_character_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gm_id?: string;
          name?: string;
          showing?: "lobby" | "combat";
          state?: "LOBBY" | "IN_PLAY" | "PAUSED";
          active_image_url?: string | null;
          teaser_text?: string | null;
          active_turn_character_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      session_characters: {
        Row: {
          id: string;
          session_id: string;
          name: string;
          portrait_url: string | null;
          is_premade: boolean;
          character_type: "player" | "npc" | "monster";
          hp: number | null;
          max_hp: number | null;
          ac: number | null;
          initiative_modifier: number;
          initiative_roll: number | null;
          hand_raised: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          name: string;
          portrait_url?: string | null;
          is_premade?: boolean;
          character_type?: "player" | "npc" | "monster";
          hp?: number | null;
          max_hp?: number | null;
          ac?: number | null;
          initiative_modifier?: number;
          initiative_roll?: number | null;
          hand_raised?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          name?: string;
          portrait_url?: string | null;
          is_premade?: boolean;
          character_type?: "player" | "npc" | "monster";
          hp?: number | null;
          max_hp?: number | null;
          ac?: number | null;
          initiative_modifier?: number;
          initiative_roll?: number | null;
          hand_raised?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "session_characters_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      session_assets: {
        Row: {
          id: string;
          gm_id: string;
          asset_type: "map" | "portrait" | "scene";
          storage_bucket: "portraits" | "scenes" | "maps";
          storage_path: string;
          public_url: string | null;
          friendly_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          gm_id: string;
          asset_type: "map" | "portrait" | "scene";
          storage_bucket: "portraits" | "scenes" | "maps";
          storage_path: string;
          public_url?: string | null;
          friendly_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          gm_id?: string;
          asset_type?: "map" | "portrait" | "scene";
          storage_bucket?: "portraits" | "scenes" | "maps";
          storage_path?: string;
          public_url?: string | null;
          friendly_name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      premade_characters: {
        Row: {
          id: string;
          gm_id: string;
          name: string;
          portrait_url: string | null;
          stats_json: { STR: number; DEX: number; CON: number; INT: number; WIS: number; CHA: number; };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          gm_id: string;
          name: string;
          portrait_url?: string | null;
          stats_json: { STR: number; DEX: number; CON: number; INT: number; WIS: number; CHA: number; };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          gm_id?: string;
          name?: string;
          portrait_url?: string | null;
          stats_json?: { STR: number; DEX: number; CON: number; INT: number; WIS: number; CHA: number; };
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
