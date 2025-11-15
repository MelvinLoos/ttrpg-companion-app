export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      active_combats: {
        Row: {
          current_turn_id: string | null
          encounter_id: string | null
          ended_at: string | null
          id: string
          round_number: number
          session_id: string
          started_at: string | null
        }
        Insert: {
          current_turn_id?: string | null
          encounter_id?: string | null
          ended_at?: string | null
          id?: string
          round_number?: number
          session_id: string
          started_at?: string | null
        }
        Update: {
          current_turn_id?: string | null
          encounter_id?: string | null
          ended_at?: string | null
          id?: string
          round_number?: number
          session_id?: string
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "active_combats_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "combat_encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "active_combats_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      combat_encounter_monsters: {
        Row: {
          created_at: string | null
          encounter_id: string
          id: string
          monster_template_id: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          encounter_id: string
          id?: string
          monster_template_id: string
          quantity?: number
        }
        Update: {
          created_at?: string | null
          encounter_id?: string
          id?: string
          monster_template_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "combat_encounter_monsters_encounter_id_fkey"
            columns: ["encounter_id"]
            isOneToOne: false
            referencedRelation: "combat_encounters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combat_encounter_monsters_monster_template_id_fkey"
            columns: ["monster_template_id"]
            isOneToOne: false
            referencedRelation: "monster_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      combat_encounters: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      combat_participants: {
        Row: {
          armor_class: number | null
          character_id: string | null
          combat_id: string
          created_at: string | null
          current_hit_points: number | null
          id: string
          initiative: number | null
          is_active: boolean
          max_hit_points: number | null
          monster_template_id: string | null
          name: string
          turn_order: number | null
        }
        Insert: {
          armor_class?: number | null
          character_id?: string | null
          combat_id: string
          created_at?: string | null
          current_hit_points?: number | null
          id?: string
          initiative?: number | null
          is_active?: boolean
          max_hit_points?: number | null
          monster_template_id?: string | null
          name: string
          turn_order?: number | null
        }
        Update: {
          armor_class?: number | null
          character_id?: string | null
          combat_id?: string
          created_at?: string | null
          current_hit_points?: number | null
          id?: string
          initiative?: number | null
          is_active?: boolean
          max_hit_points?: number | null
          monster_template_id?: string | null
          name?: string
          turn_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "combat_participants_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "session_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combat_participants_combat_id_fkey"
            columns: ["combat_id"]
            isOneToOne: false
            referencedRelation: "active_combats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "combat_participants_monster_template_id_fkey"
            columns: ["monster_template_id"]
            isOneToOne: false
            referencedRelation: "monster_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      monster_templates: {
        Row: {
          armor_class: number
          challenge_rating: string | null
          created_at: string | null
          description: string | null
          hit_points: number
          id: string
          name: string
        }
        Insert: {
          armor_class: number
          challenge_rating?: string | null
          created_at?: string | null
          description?: string | null
          hit_points: number
          id?: string
          name: string
        }
        Update: {
          armor_class?: number
          challenge_rating?: string | null
          created_at?: string | null
          description?: string | null
          hit_points?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      premade_characters: {
        Row: {
          created_at: string | null
          gm_id: string | null
          id: string
          name: string
          portrait_url: string | null
          stats_json: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          gm_id?: string | null
          id?: string
          name: string
          portrait_url?: string | null
          stats_json?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          gm_id?: string | null
          id?: string
          name?: string
          portrait_url?: string | null
          stats_json?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      session_assets: {
        Row: {
          asset_type: string
          created_at: string | null
          friendly_name: string | null
          gm_id: string | null
          id: string
          public_url: string | null
          storage_bucket: string
          storage_path: string
        }
        Insert: {
          asset_type: string
          created_at?: string | null
          friendly_name?: string | null
          gm_id?: string | null
          id?: string
          public_url?: string | null
          storage_bucket: string
          storage_path: string
        }
        Update: {
          asset_type?: string
          created_at?: string | null
          friendly_name?: string | null
          gm_id?: string | null
          id?: string
          public_url?: string | null
          storage_bucket?: string
          storage_path?: string
        }
        Relationships: []
      }
      session_characters: {
        Row: {
          character_type: string | null
          created_at: string | null
          hand_raised: boolean | null
          id: string
          initiative_modifier: number | null
          initiative_roll: number | null
          is_premade: boolean | null
          name: string
          portrait_url: string | null
          session_id: string | null
          updated_at: string | null
        }
        Insert: {
          character_type?: string | null
          created_at?: string | null
          hand_raised?: boolean | null
          id?: string
          initiative_modifier?: number | null
          initiative_roll?: number | null
          is_premade?: boolean | null
          name: string
          portrait_url?: string | null
          session_id?: string | null
          updated_at?: string | null
        }
        Update: {
          character_type?: string | null
          created_at?: string | null
          hand_raised?: boolean | null
          id?: string
          initiative_modifier?: number | null
          initiative_roll?: number | null
          is_premade?: boolean | null
          name?: string
          portrait_url?: string | null
          session_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "session_characters_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          active_image_url: string | null
          active_turn_character_id: string | null
          created_at: string | null
          gm_id: string | null
          id: string
          name: string
          showing: string
          teaser_text: string | null
          updated_at: string | null
        }
        Insert: {
          active_image_url?: string | null
          active_turn_character_id?: string | null
          created_at?: string | null
          gm_id?: string | null
          id?: string
          name: string
          showing?: string
          teaser_text?: string | null
          updated_at?: string | null
        }
        Update: {
          active_image_url?: string | null
          active_turn_character_id?: string | null
          created_at?: string | null
          gm_id?: string | null
          id?: string
          name?: string
          showing?: string
          teaser_text?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      uuid_generate_v1: { Args: never; Returns: string }
      uuid_generate_v1mc: { Args: never; Returns: string }
      uuid_generate_v3: {
        Args: { name: string; namespace: string }
        Returns: string
      }
      uuid_generate_v4: { Args: never; Returns: string }
      uuid_generate_v5: {
        Args: { name: string; namespace: string }
        Returns: string
      }
      uuid_nil: { Args: never; Returns: string }
      uuid_ns_dns: { Args: never; Returns: string }
      uuid_ns_oid: { Args: never; Returns: string }
      uuid_ns_url: { Args: never; Returns: string }
      uuid_ns_x500: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

