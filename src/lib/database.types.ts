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
      contact_messages: {
        Row: {
          admin_note: string | null
          company: string | null
          consent: boolean
          country: string | null
          created_at: string
          email: string
          fleet_size: string | null
          id: string
          kind: string
          locale: string | null
          message: string
          name: string | null
          phone: string | null
          source: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          company?: string | null
          consent?: boolean
          country?: string | null
          created_at?: string
          email: string
          fleet_size?: string | null
          id?: string
          kind?: string
          locale?: string | null
          message: string
          name?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          company?: string | null
          consent?: boolean
          country?: string | null
          created_at?: string
          email?: string
          fleet_size?: string | null
          id?: string
          kind?: string
          locale?: string | null
          message?: string
          name?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      demo_visits: {
        Row: {
          created_at: string
          id: number
          locale: string | null
          path: string | null
          ref_code: string
        }
        Insert: {
          created_at?: string
          id?: never
          locale?: string | null
          path?: string | null
          ref_code: string
        }
        Update: {
          created_at?: string
          id?: never
          locale?: string | null
          path?: string | null
          ref_code?: string
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
          lat: number | null
          lng: number | null
          loc_accuracy: number | null
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
          lat?: number | null
          lng?: number | null
          loc_accuracy?: number | null
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
          lat?: number | null
          lng?: number | null
          loc_accuracy?: number | null
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
          lat: number | null
          lng: number | null
          loc_accuracy: number | null
        }
        Insert: {
          created_by?: string | null
          hours: number
          id?: never
          machine_id: string
          org_id: string
          read_at?: string
          source?: string
          lat?: number | null
          lng?: number | null
          loc_accuracy?: number | null
        }
        Update: {
          created_by?: string | null
          hours?: number
          id?: never
          machine_id?: string
          org_id?: string
          read_at?: string
          source?: string
          lat?: number | null
          lng?: number | null
          loc_accuracy?: number | null
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
      ideas: {
        Row: {
          admin_note: string | null
          category: string
          created_at: string
          details: string | null
          email: string | null
          id: string
          locale: string | null
          org_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          category?: string
          created_at?: string
          details?: string | null
          email?: string | null
          id?: string
          locale?: string | null
          org_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          category?: string
          created_at?: string
          details?: string | null
          email?: string | null
          id?: string
          locale?: string | null
          org_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ideas_org_id_fkey"
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
      job_runs: {
        Row: {
          job: string
          last_run_at: string
        }
        Insert: {
          job: string
          last_run_at: string
        }
        Update: {
          job?: string
          last_run_at?: string
        }
        Relationships: []
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
          last_lat: number | null
          last_lng: number | null
          last_loc_accuracy: number | null
          last_located_at: string | null
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
          last_lat?: number | null
          last_lng?: number | null
          last_loc_accuracy?: number | null
          last_located_at?: string | null
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
          last_lat?: number | null
          last_lng?: number | null
          last_loc_accuracy?: number | null
          last_located_at?: string | null
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
          rental_check_id: string | null
          slot: string | null
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
          rental_check_id?: string | null
          slot?: string | null
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
          rental_check_id?: string | null
          slot?: string | null
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
      notification_log: {
        Row: {
          channel: string
          created_at: string
          detail: string | null
          id: number
          kind: string
          org_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          channel?: string
          created_at?: string
          detail?: string | null
          id?: never
          kind: string
          org_id?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          detail?: string | null
          id?: never
          kind?: string
          org_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notification_prefs: {
        Row: {
          email_enabled: boolean
          frequency: string
          last_digest_at: string | null
          lead_days: number
          lead_hours: number
          updated_at: string
          user_id: string
        }
        Insert: {
          email_enabled?: boolean
          frequency?: string
          last_digest_at?: string | null
          lead_days?: number
          lead_hours?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          email_enabled?: boolean
          frequency?: string
          last_digest_at?: string | null
          lead_days?: number
          lead_hours?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_prefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_interval: string | null
          billing_tier: string | null
          cancel_at_period_end: boolean
          current_period_end: string | null
          founder: boolean
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          canton: string | null
          country: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          name: string
          plan: string
          trial_ends_at: string
          track_location: boolean
          rental_addon: boolean
          rental_report_cc: string | null
          rental_terms_path: string | null
          rental_terms_updated_at: string | null
        }
        Insert: {
          billing_interval?: string | null
          billing_tier?: string | null
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          founder?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          canton?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          name: string
          plan?: string
          trial_ends_at?: string
          track_location?: boolean
          rental_addon?: boolean
          rental_report_cc?: string | null
          rental_terms_path?: string | null
          rental_terms_updated_at?: string | null
        }
        Update: {
          billing_interval?: string | null
          billing_tier?: string | null
          cancel_at_period_end?: boolean
          current_period_end?: string | null
          founder?: boolean
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          canton?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          name?: string
          plan?: string
          trial_ends_at?: string
          track_location?: boolean
          rental_addon?: boolean
          rental_report_cc?: string | null
          rental_terms_path?: string | null
          rental_terms_updated_at?: string | null
        }
        Relationships: []
      }
      outreach: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body: string
          channel: string
          created_at: string
          id: string
          locale: string
          prospect_id: string
          sent_at: string | null
          status: string
          step: number
          subject: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          body: string
          channel: string
          created_at?: string
          id?: string
          locale: string
          prospect_id: string
          sent_at?: string | null
          status?: string
          step?: number
          subject?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          body?: string
          channel?: string
          created_at?: string
          id?: string
          locale?: string
          prospect_id?: string
          sent_at?: string | null
          status?: string
          step?: number
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outreach_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          locale: string
          signup_ref: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          locale?: string
          signup_ref?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          locale?: string
          signup_ref?: string | null
        }
        Relationships: []
      }
      prospects: {
        Row: {
          address: string | null
          channel: string | null
          city: string | null
          company: string
          country: string
          created_at: string
          created_by: string
          email: string | null
          fleet_estimate: string | null
          id: string
          legal_id: string | null
          locale: string | null
          next_action_at: string | null
          notes: string | null
          phone: string | null
          postal_code: string | null
          ref_code: string | null
          region: string | null
          segment: string
          signals: string | null
          source: string
          status: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          channel?: string | null
          city?: string | null
          company: string
          country: string
          created_at?: string
          created_by?: string
          email?: string | null
          fleet_estimate?: string | null
          id?: string
          legal_id?: string | null
          locale?: string | null
          next_action_at?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          ref_code?: string | null
          region?: string | null
          segment?: string
          signals?: string | null
          source: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          channel?: string | null
          city?: string | null
          company?: string
          country?: string
          created_at?: string
          created_by?: string
          email?: string | null
          fleet_estimate?: string | null
          id?: string
          legal_id?: string | null
          locale?: string | null
          next_action_at?: string | null
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          ref_code?: string | null
          region?: string | null
          segment?: string
          signals?: string | null
          source?: string
          status?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      rental_checks: {
        Row: {
          accessories: string | null
          accident: boolean
          accident_note: string | null
          charges: Json
          client_signature: string
          client_signer: string
          created_at: string
          created_by: string | null
          emailed_at: string | null
          fuel_level: string | null
          hours: number | null
          id: string
          items: Json
          keys_count: number | null
          kind: string
          lat: number | null
          lng: number | null
          machine_id: string
          org_id: string
          remarks: string | null
          rental_id: string
          report_path: string | null
          reserves: boolean | null
          safety_until: string | null
          safety_valid: boolean | null
          staff_signature: string | null
          staff_signer: string | null
          terms_accepted: boolean
          breakdown: boolean
          breakdown_note: string | null
          terms_path: string | null
        }
        Insert: {
          accessories?: string | null
          accident?: boolean
          accident_note?: string | null
          charges?: Json
          client_signature: string
          client_signer: string
          created_at?: string
          created_by?: string | null
          emailed_at?: string | null
          fuel_level?: string | null
          hours?: number | null
          id?: string
          items?: Json
          keys_count?: number | null
          kind: string
          lat?: number | null
          lng?: number | null
          machine_id: string
          org_id: string
          remarks?: string | null
          rental_id: string
          report_path?: string | null
          reserves?: boolean | null
          safety_until?: string | null
          safety_valid?: boolean | null
          staff_signature?: string | null
          staff_signer?: string | null
          terms_accepted?: boolean
          breakdown?: boolean
          breakdown_note?: string | null
          terms_path?: string | null
        }
        Update: {
          accessories?: string | null
          accident?: boolean
          accident_note?: string | null
          charges?: Json
          client_signature?: string
          client_signer?: string
          created_at?: string
          created_by?: string | null
          emailed_at?: string | null
          fuel_level?: string | null
          hours?: number | null
          id?: string
          items?: Json
          keys_count?: number | null
          kind?: string
          lat?: number | null
          lng?: number | null
          machine_id?: string
          org_id?: string
          remarks?: string | null
          rental_id?: string
          report_path?: string | null
          reserves?: boolean | null
          safety_until?: string | null
          safety_valid?: boolean | null
          staff_signature?: string | null
          staff_signer?: string | null
          terms_accepted?: boolean
          breakdown?: boolean
          breakdown_note?: string | null
          terms_path?: string | null
        }
        Relationships: []
      }
      rentals: {
        Row: {
          back_at: string | null
          client_company: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          created_by: string | null
          delivery: string
          end_at: string
          id: string
          machine_id: string
          notes: string | null
          org_id: string
          out_at: string | null
          site: string | null
          start_at: string
          status: string
          transport: Json
          updated_at: string
        }
        Insert: {
          back_at?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          delivery?: string
          end_at: string
          id?: string
          machine_id: string
          notes?: string | null
          org_id: string
          out_at?: string | null
          site?: string | null
          start_at: string
          status?: string
          transport?: Json
          updated_at?: string
        }
        Update: {
          back_at?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          created_by?: string | null
          delivery?: string
          end_at?: string
          id?: string
          machine_id?: string
          notes?: string | null
          org_id?: string
          out_at?: string | null
          site?: string | null
          start_at?: string
          status?: string
          transport?: Json
          updated_at?: string
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
      create_demo_machine_v2: {
        Args: { p_org: string; p_payload: Json }
        Returns: string
      }
      create_org: {
        Args: {
          p_canton?: string
          p_country?: string
          p_locale?: string
          p_name: string
        }
        Returns: string
      }
      create_organization: {
        Args: { p_canton?: string; p_name: string }
        Returns: string
      }
      founder_slots_left: { Args: never; Returns: number }
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
      is_platform_admin: { Args: never; Returns: boolean }
      log_demo_visit: {
        Args: { p_locale?: string; p_path?: string; p_ref: string }
        Returns: undefined
      }
      submit_contact: { Args: { p: Json }; Returns: string }
      submit_idea: { Args: { p: Json }; Returns: string }
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
        | "pelle_pneus"
        | "pelle_araignee"
        | "chargeuse_compacte"
        | "tractopelle"
        | "bulldozer"
        | "niveleuse"
        | "mini_dumper"
        | "camion_grue"
        | "camion_malaxeur"
        | "grue_tour"
        | "chariot_telescopique"
        | "chariot_elevateur"
        | "nacelle_ciseaux"
        | "nacelle_articulee"
        | "nacelle_telescopique"
        | "rouleau_tandem"
        | "plaque_vibrante"
        | "finisseur"
        | "fraiseuse"
        | "pompe_beton"
        | "foreuse"
        | "concasseur"
        | "crible"
        | "groupe_electrogene"
        | "compresseur"
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
      machine_kind: [
        "pelle",
        "mini_pelle",
        "chargeuse",
        "dumper",
        "camion",
        "grue",
        "rouleau",
        "pelle_pneus",
        "pelle_araignee",
        "chargeuse_compacte",
        "tractopelle",
        "bulldozer",
        "niveleuse",
        "mini_dumper",
        "camion_grue",
        "camion_malaxeur",
        "grue_tour",
        "chariot_telescopique",
        "chariot_elevateur",
        "nacelle_ciseaux",
        "nacelle_articulee",
        "nacelle_telescopique",
        "rouleau_tandem",
        "plaque_vibrante",
        "finisseur",
        "fraiseuse",
        "pompe_beton",
        "foreuse",
        "concasseur",
        "crible",
        "groupe_electrogene",
        "compresseur",
        "autre",
      ],
      media_kind: ["photo", "video", "document"],
      member_role: ["owner", "admin", "mechanic", "operator"],
      repair_status: ["fait", "en_cours", "attente_piece"],
      schedule_basis: ["heures", "date"],
    },
  },
} as const
