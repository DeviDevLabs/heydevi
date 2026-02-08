export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      consumed_meals: {
        Row: {
          calories: number
          consumed_date: string
          created_at: string
          description: string | null
          id: string
          meal_label: string
          meal_time: string | null
          protein: number
          recipe_id: string | null
          user_id: string
        }
        Insert: {
          calories?: number
          consumed_date?: string
          created_at?: string
          description?: string | null
          id?: string
          meal_label: string
          meal_time?: string | null
          protein?: number
          recipe_id?: string | null
          user_id: string
        }
        Update: {
          calories?: number
          consumed_date?: string
          created_at?: string
          description?: string | null
          id?: string
          meal_label?: string
          meal_time?: string | null
          protein?: number
          recipe_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      digestive_logs: {
        Row: {
          alcohol: boolean | null
          associated_meal: string | null
          associated_recipe_id: string | null
          bloating: number | null
          bristol: number | null
          coffee: boolean | null
          created_at: string
          cycle_phase: string | null
          energy: number | null
          frequency: number | null
          gas: number | null
          id: string
          log_date: string
          log_time: string | null
          meds_notes: string | null
          notes: string | null
          pain: number | null
          reflux: number | null
          severity: number
          sleep_hours: number | null
          stress: number | null
          symptom: string
          urgency: number | null
          user_id: string
        }
        Insert: {
          alcohol?: boolean | null
          associated_meal?: string | null
          associated_recipe_id?: string | null
          bloating?: number | null
          bristol?: number | null
          coffee?: boolean | null
          created_at?: string
          cycle_phase?: string | null
          energy?: number | null
          frequency?: number | null
          gas?: number | null
          id?: string
          log_date?: string
          log_time?: string | null
          meds_notes?: string | null
          notes?: string | null
          pain?: number | null
          reflux?: number | null
          severity: number
          sleep_hours?: number | null
          stress?: number | null
          symptom: string
          urgency?: number | null
          user_id: string
        }
        Update: {
          alcohol?: boolean | null
          associated_meal?: string | null
          associated_recipe_id?: string | null
          bloating?: number | null
          bristol?: number | null
          coffee?: boolean | null
          created_at?: string
          cycle_phase?: string | null
          energy?: number | null
          frequency?: number | null
          gas?: number | null
          id?: string
          log_date?: string
          log_time?: string | null
          meds_notes?: string | null
          notes?: string | null
          pain?: number | null
          reflux?: number | null
          severity?: number
          sleep_hours?: number | null
          stress?: number | null
          symptom?: string
          urgency?: number | null
          user_id?: string
        }
        Relationships: []
      }
      digestive_profiles: {
        Row: {
          created_at: string
          fiber_tolerance: string | null
          gluten_sensitive: boolean | null
          id: string
          lactose_sensitive: boolean | null
          notes: string | null
          problem_foods: string[] | null
          triggers: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fiber_tolerance?: string | null
          gluten_sensitive?: boolean | null
          id?: string
          lactose_sensitive?: boolean | null
          notes?: string | null
          problem_foods?: string[] | null
          triggers?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fiber_tolerance?: string | null
          gluten_sensitive?: boolean | null
          id?: string
          lactose_sensitive?: boolean | null
          notes?: string | null
          problem_foods?: string[] | null
          triggers?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      food_experiments: {
        Row: {
          created_at: string
          end_date: string | null
          food_item_id: string
          id: string
          notes: string | null
          start_date: string
          target_dose: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          food_item_id: string
          id?: string
          notes?: string | null
          start_date?: string
          target_dose?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          food_item_id?: string
          id?: string
          notes?: string | null
          start_date?: string
          target_dose?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "food_experiments_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
        ]
      }
      food_items: {
        Row: {
          canonical_name: string
          category: string
          created_at: string
          default_unit: string
          id: string
          name: string
          synonyms: string[] | null
        }
        Insert: {
          canonical_name: string
          category?: string
          created_at?: string
          default_unit?: string
          id?: string
          name: string
          synonyms?: string[] | null
        }
        Update: {
          canonical_name?: string
          category?: string
          created_at?: string
          default_unit?: string
          id?: string
          name?: string
          synonyms?: string[] | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string
          created_at: string
          food_item_id: string | null
          grams_available: number
          id: string
          ingredient_name: string
          item_type: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          food_item_id?: string | null
          grams_available?: number
          id?: string
          ingredient_name: string
          item_type?: string
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          food_item_id?: string | null
          grams_available?: number
          id?: string
          ingredient_name?: string
          item_type?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_log_items: {
        Row: {
          food_item_id: string
          id: string
          meal_log_id: string
          qty: number
          unit: string
        }
        Insert: {
          food_item_id: string
          id?: string
          meal_log_id: string
          qty?: number
          unit?: string
        }
        Update: {
          food_item_id?: string
          id?: string
          meal_log_id?: string
          qty?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_log_items_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_log_items_meal_log_id_fkey"
            columns: ["meal_log_id"]
            isOneToOne: false
            referencedRelation: "meal_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_logs: {
        Row: {
          created_at: string
          id: string
          logged_at: string
          notes: string | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          logged_at?: string
          notes?: string | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          logged_at?: string
          notes?: string | null
          tags?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      profile_histories: {
        Row: {
          created_at: string
          id: string
          profile: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile?: Json
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          calorie_target: number | null
          created_at: string
          height_cm: number | null
          id: string
          protein_target: number | null
          restrictions: Json | null
          sex: string | null
          training_time: string | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          calorie_target?: number | null
          created_at?: string
          height_cm?: number | null
          id?: string
          protein_target?: number | null
          restrictions?: Json | null
          sex?: string | null
          training_time?: string | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          calorie_target?: number | null
          created_at?: string
          height_cm?: number | null
          id?: string
          protein_target?: number | null
          restrictions?: Json | null
          sex?: string | null
          training_time?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string
          food_item_id: string
          id: string
          purchased_at: string
          qty: number
          unit: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          food_item_id: string
          id?: string
          purchased_at?: string
          qty?: number
          unit?: string
          user_id: string
          week_start?: string
        }
        Update: {
          created_at?: string
          food_item_id?: string
          id?: string
          purchased_at?: string
          qty?: number
          unit?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_food_item_id_fkey"
            columns: ["food_item_id"]
            isOneToOne: false
            referencedRelation: "food_items"
            referencedColumns: ["id"]
          },
        ]
      }
      supplement_regimens: {
        Row: {
          created_at: string
          dose_unit: string
          dose_value: number
          end_date: string | null
          frequency: string
          id: string
          start_date: string
          supplement_id: string
          time_of_day: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dose_unit?: string
          dose_value: number
          end_date?: string | null
          frequency?: string
          id?: string
          start_date: string
          supplement_id: string
          time_of_day?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          dose_unit?: string
          dose_value?: number
          end_date?: string | null
          frequency?: string
          id?: string
          start_date?: string
          supplement_id?: string
          time_of_day?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplement_regimens_supplement_id_fkey"
            columns: ["supplement_id"]
            isOneToOne: false
            referencedRelation: "user_supplements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_supplements: {
        Row: {
          active: boolean
          brand: string | null
          created_at: string
          default_unit: string | null
          form: string | null
          id: string
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          brand?: string | null
          created_at?: string
          default_unit?: string | null
          form?: string | null
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          brand?: string | null
          created_at?: string
          default_unit?: string | null
          form?: string | null
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
  public: {
    Enums: {},
  },
} as const
