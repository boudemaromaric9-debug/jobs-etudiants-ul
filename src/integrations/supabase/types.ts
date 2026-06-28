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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          created_by: string | null
          date_activite: string
          description: string | null
          heure_debut: string
          heure_fin: string
          id: string
          lieu: string
          max_participants: number
          remuneration: number
          responsable: string | null
          status: Database["public"]["Enums"]["activity_status"]
          titre: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date_activite: string
          description?: string | null
          heure_debut: string
          heure_fin: string
          id?: string
          lieu: string
          max_participants?: number
          remuneration?: number
          responsable?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          titre: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date_activite?: string
          description?: string | null
          heure_debut?: string
          heure_fin?: string
          id?: string
          lieu?: string
          max_participants?: number
          remuneration?: number
          responsable?: string | null
          status?: Database["public"]["Enums"]["activity_status"]
          titre?: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          contenu: string
          created_at: string
          created_by: string | null
          id: string
          titre: string
          updated_at: string
        }
        Insert: {
          contenu: string
          created_at?: string
          created_by?: string | null
          id?: string
          titre: string
          updated_at?: string
        }
        Update: {
          contenu?: string
          created_at?: string
          created_by?: string | null
          id?: string
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      availabilities: {
        Row: {
          created_at: string
          creneau: Database["public"]["Enums"]["creneau_type"]
          id: string
          jour: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creneau: Database["public"]["Enums"]["creneau_type"]
          id?: string
          jour: string
          user_id: string
        }
        Update: {
          created_at?: string
          creneau?: Database["public"]["Enums"]["creneau_type"]
          id?: string
          jour?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          activity_id: string | null
          created_at: string
          date_paiement: string | null
          id: string
          montant: number
          reference: string | null
          registration_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          date_paiement?: string | null
          id?: string
          montant?: number
          reference?: string | null
          registration_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          date_paiement?: string | null
          id?: string
          montant?: number
          reference?: string | null
          registration_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          faculte: string | null
          id: string
          niveau: string | null
          nom: string
          photo_url: string | null
          prenoms: string
          score: number
          sexe: Database["public"]["Enums"]["sexe_type"] | null
          status: Database["public"]["Enums"]["profile_status"]
          telephone: string | null
          total_gains: number
          total_heures: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          faculte?: string | null
          id: string
          niveau?: string | null
          nom?: string
          photo_url?: string | null
          prenoms?: string
          score?: number
          sexe?: Database["public"]["Enums"]["sexe_type"] | null
          status?: Database["public"]["Enums"]["profile_status"]
          telephone?: string | null
          total_gains?: number
          total_heures?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          faculte?: string | null
          id?: string
          niveau?: string | null
          nom?: string
          photo_url?: string | null
          prenoms?: string
          score?: number
          sexe?: Database["public"]["Enums"]["sexe_type"] | null
          status?: Database["public"]["Enums"]["profile_status"]
          telephone?: string | null
          total_gains?: number
          total_heures?: number
          updated_at?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          activity_id: string
          check_in: string | null
          check_out: string | null
          created_at: string
          heures_effectuees: number
          id: string
          montant_du: number
          note: string | null
          score_discipline: number | null
          score_ponctualite: number | null
          score_qualite: number | null
          status: Database["public"]["Enums"]["registration_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          heures_effectuees?: number
          id?: string
          montant_du?: number
          note?: string | null
          score_discipline?: number | null
          score_ponctualite?: number | null
          score_qualite?: number | null
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          heures_effectuees?: number
          id?: string
          montant_du?: number
          note?: string | null
          score_discipline?: number | null
          score_ponctualite?: number | null
          score_qualite?: number | null
          status?: Database["public"]["Enums"]["registration_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_status: "draft" | "open" | "closed" | "cancelled" | "completed"
      activity_type:
        | "nettoyage_amphi"
        | "debroussaillage"
        | "balayage"
        | "plantation"
        | "collecte_dechets"
        | "espaces_verts"
        | "autre"
      app_role: "admin" | "student"
      creneau_type: "matin" | "aprem" | "soir"
      payment_status: "pending" | "paid"
      profile_status: "pending" | "active" | "suspended"
      registration_status: "registered" | "cancelled" | "attended" | "no_show"
      sexe_type: "M" | "F"
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
    Enums: {
      activity_status: ["draft", "open", "closed", "cancelled", "completed"],
      activity_type: [
        "nettoyage_amphi",
        "debroussaillage",
        "balayage",
        "plantation",
        "collecte_dechets",
        "espaces_verts",
        "autre",
      ],
      app_role: ["admin", "student"],
      creneau_type: ["matin", "aprem", "soir"],
      payment_status: ["pending", "paid"],
      profile_status: ["pending", "active", "suspended"],
      registration_status: ["registered", "cancelled", "attended", "no_show"],
      sexe_type: ["M", "F"],
    },
  },
} as const
