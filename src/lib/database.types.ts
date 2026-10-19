// Généré depuis Supabase (projet « Godet »). Ne pas modifier à la main : régénérer après chaque migration.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor: string | null
          at: string
          details: Json
          entity: string
          entity_id: string | null
          id: number
          org_id: string | null
        }
        Insert: {
          action: string
          actor?: string | null
          at?: string
          details?: Json
          entity: string
          entity_id?: string | null
          id?: never
          org_id?: string | null
        }
        Update: {
          action?: string
          actor?: string | null
          at?: string
          details?: Json
          entity?: string
          entity_id?: string | null
          id?: never
          org_id?: string | null
        }
        Relationships: []
      }
      entries: {
        Row: {
          cost_labour: number
          cost_parts: number
          created_at: string
          created_by: string | null
          date: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          details: string | null
          downtime_hours: number | null
          hours: number | null
          id: string
          kind: Database["public"]["Enums"]["entry_kind"]
          machine_id: string
          org_id: string
          part_qty: number | null
          part_ref: string | null
          performed_by: string | null
          repair_status: Database["public"]["Enums"]["repair_status"] | null
          schedule_id: string | null
          supplier: string | null
          title: string
          updated_at: string
          warranty_until: string | null
        }
        Insert: {
          cost_labour?: number
          cost_parts?: number
          created_at?: string
          created_by?: string | null
          date?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          details?: string | null
          downtime_hours?: number | null
          hours?: number | null
          id?: string
          kind: Database["public"]["Enums"]["entry_kind"]
          machine_id: string
          org_id: string
          part_qty?: number | null
          part_ref?: string | null
          performed_by?: string | null
          repair_status?: Database["public"]["Enums"]["repair_status"] | null
          schedule_id?: string | null
          supplier?: string | null
          title: string
          updated_at?: string
          warranty_until?: string | null
        }
        Update: {
          cost_labour?: number
          cost_parts?: number
          created_at?: string
          created_by?: string | null
          date?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          details?: string | null
          downtime_hours?: number | null
          hours?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["entry_kind"]
          machine_id?: string
          org_id?: string
          part_qty?: number | null
          part_ref?: string | null
          performed_by?: string | null
          repair_status?: Database["public"]["Enums"]["repair_status"] | null
          schedule_id?: string | null
          supplier?: string | null
          title?: string
          updated_at?: string
          warranty_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entries_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      hour_readings: {
        Row: {
          created_by: string | null
          hours: number
          id: number
          machine_id: string
          org_id: string
          read_at: string
          source: string
        }
        Insert: {
          created_by?: string | null
          hours: number
          id?: never
          machine_id: string
          org_id: string
          read_at?: string
          source?: string
        }
        Update: {
          created_by?: string | null
          hours?: number
          id?: never
          machine_id?: string
          org_id?: string
          read_at?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "hour_readings_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hour_readings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          org_id: string
          role: Database["public"]["Enums"]["member_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id: string
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          org_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      machines: {
        Row: {
          archived_at: string | null
          brand: string | null
          code: string
          color: string
          created_at: string
          created_by: string | null
          hours: number
          hours_at: string
          id: string
          kind: Database["public"]["Enums"]["machine_kind"]
          model: string | null
          notes: string | null
          org_id: string
          plate: string | null
          position: number
          serial: string | null
          updated_at: string
          weight_t: number | null
          year: number | null
        }
        Insert: {
          archived_at?: string | null
          brand?: string | null
          code: string
          color?: string
          created_at?: string
          created_by?: string | null
          hours?: number
          hours_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["machine_kind"]
          model?: string | null
          notes?: string | null
          org_id: string
          plate?: string | null
          position?: number
          serial?: string | null
          updated_at?: string
          weight_t?: number | null
          year?: number | null
        }
        Update: {
          archived_at?: string | null
          brand?: string | null
          code?: string
          color?: string
          created_at?: string
          created_by?: string | null
          hours?: number
          hours_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["machine_kind"]
          model?: string | null
          notes?: string | null
          org_id?: string
          plate?: string | null
          position?: number
          serial?: string | null
          updated_at?: string
          weight_t?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "machines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          caption: string | null
          created_at: string
          created_by: string | null
          entry_id: string | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          machine_id: string
          mime: string | null
          org_id: string
          path: string
          size_bytes: number | null
          taken_at: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          entry_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["media_kind"]
          machine_id: string
          mime?: string | null
          org_id: string
          path: string
          size_bytes?: number | null
          taken_at?: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          created_by?: string | null
          entry_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          machine_id?: string
          mime?: string | null
          org_id?: string
          path?: string
          size_bytes?: number | null
          taken_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          org_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          canton: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          plan: string
          trial_ends_at: string
        }
        Insert: {
          canton?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          plan?: string
          trial_ends_at?: string
        }
        Update: {
          canton?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          plan?: string
          trial_ends_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          active: boolean
          basis: Database["public"]["Enums"]["schedule_basis"]
          created_at: string
          due_date: string | null
          due_hours: number | null
          id: string
          interval_days: number | null
          interval_hours: number | null
          label: string
          last_date: string | null
          last_hours: number | null
          machine_id: string
          org_id: string
        }
        Insert: {
          active?: boolean
          basis: Database["public"]["Enums"]["schedule_basis"]
          created_at?: string
          due_date?: string | null
          due_hours?: number | null
          id?: string
          interval_days?: number | null
          interval_hours?: number | null
          label: string
          last_date?: string | null
          last_hours?: number | null
          machine_id: string
          org_id: string
        }
        Update: {
          active?: boolean
          basis?: Database["public"]["Enums"]["schedule_basis"]
          created_at?: string
          due_date?: string | null
          due_hours?: number | null
          id?: string
          interval_days?: number | null
          interval_hours?: number | null
          label?: string
          last_date?: string | null
          last_hours?: number | null
          machine_id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_machine_id_fkey"
            columns: ["machine_id"]
            isOneToOne: false
            referencedRelation: "machines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { p_token: string }; Returns: string }
      create_demo_machine: { Args: { p_org: string }; Returns: string }
      create_organization: {
        Args: { p_canton?: string; p_name: string }
        Returns: string
      }
      invitation_info: {
        Args: { p_token: string }
        Returns: {
          accepted: boolean
          email: string
          expired: boolean
          org_name: string
          role: Database["public"]["Enums"]["member_role"]
        }[]
      }
    }
    Enums: {
      entry_kind:
        | "service"
        | "reparation"
        | "piece"
        | "controle"
        | "inspection"
        | "note"
      machine_kind:
        | "pelle"
        | "mini_pelle"
        | "chargeuse"
        | "dumper"
        | "camion"
        | "grue"
        | "rouleau"
        | "autre"
      media_kind: "photo" | "video" | "document"
      member_role: "owner" | "admin" | "mechanic" | "operator"
      repair_status: "fait" | "en_cours" | "attente_piece"
      schedule_basis: "heures" | "date"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  T extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]),
> = (DefaultSchema["Tables"] & DefaultSchema["Views"])[T] extends { Row: infer R } ? R : never

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Insert: infer I } ? I : never

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T] extends { Update: infer U } ? U : never

export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T]

export const Constants = {
  public: {
    Enums: {
      entry_kind: ["service", "reparation", "piece", "controle", "inspection", "note"],
      machine_kind: ["pelle", "mini_pelle", "chargeuse", "dumper", "camion", "grue", "rouleau", "autre"],
      media_kind: ["photo", "video", "document"],
      member_role: ["owner", "admin", "mechanic", "operator"],
      repair_status: ["fait", "en_cours", "attente_piece"],
      schedule_basis: ["heures", "date"],
    },
  },
} as const
