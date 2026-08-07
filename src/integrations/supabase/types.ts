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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      api_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_label: string | null
          actor_type: string
          api_version: string | null
          application_name: string | null
          entity_id: string | null
          entity_type: string
          id: string
          new_value: Json | null
          occurred_at: string
          old_value: Json | null
          reason: string | null
          request_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_label?: string | null
          actor_type: string
          api_version?: string | null
          application_name?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          new_value?: Json | null
          occurred_at?: string
          old_value?: Json | null
          reason?: string | null
          request_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_label?: string | null
          actor_type?: string
          api_version?: string | null
          application_name?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_value?: Json | null
          occurred_at?: string
          old_value?: Json | null
          reason?: string | null
          request_id?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          allowed_versions: string[]
          application_name: string
          company_name: string
          contact_email: string
          contact_person: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          key_hash: string
          key_last4: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: string[]
          rate_limit_per_day: number
          rate_limit_per_hour: number
          rate_limit_per_minute: number
          status: Database["public"]["Enums"]["api_key_status"]
          suspended_reason: string | null
          updated_at: string
        }
        Insert: {
          allowed_versions?: string[]
          application_name?: string
          company_name?: string
          contact_email?: string
          contact_person?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash: string
          key_last4?: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: string[]
          rate_limit_per_day?: number
          rate_limit_per_hour?: number
          rate_limit_per_minute?: number
          status?: Database["public"]["Enums"]["api_key_status"]
          suspended_reason?: string | null
          updated_at?: string
        }
        Update: {
          allowed_versions?: string[]
          application_name?: string
          company_name?: string
          contact_email?: string
          contact_person?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          key_hash?: string
          key_last4?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: string[]
          rate_limit_per_day?: number
          rate_limit_per_hour?: number
          rate_limit_per_minute?: number
          status?: Database["public"]["Enums"]["api_key_status"]
          suspended_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      api_permissions: {
        Row: {
          code: string
          created_at: string
          description: string
          id: string
          module: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string
          id?: string
          module: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          id?: string
          module?: string
        }
        Relationships: []
      }
      api_rate_counters: {
        Row: {
          api_key_id: string
          hits: number
          id: string
          window_kind: string
          window_start: string
        }
        Insert: {
          api_key_id: string
          hits?: number
          id?: string
          window_kind: string
          window_start: string
        }
        Update: {
          api_key_id?: string
          hits?: number
          id?: string
          window_kind?: string
          window_start?: string
        }
        Relationships: []
      }
      api_request_logs: {
        Row: {
          api_key_id: string | null
          api_key_prefix: string | null
          api_user_id: string | null
          api_version: string | null
          application_name: string | null
          duration_ms: number | null
          endpoint: string
          http_method: string
          id: string
          level: Database["public"]["Enums"]["api_log_level"]
          message: string | null
          occurred_at: string
          outcome: string | null
          request_bytes: number | null
          request_id: string
          response_bytes: number | null
          source_ip: string | null
          status_code: number | null
        }
        Insert: {
          api_key_id?: string | null
          api_key_prefix?: string | null
          api_user_id?: string | null
          api_version?: string | null
          application_name?: string | null
          duration_ms?: number | null
          endpoint: string
          http_method: string
          id?: string
          level?: Database["public"]["Enums"]["api_log_level"]
          message?: string | null
          occurred_at?: string
          outcome?: string | null
          request_bytes?: number | null
          request_id: string
          response_bytes?: number | null
          source_ip?: string | null
          status_code?: number | null
        }
        Update: {
          api_key_id?: string | null
          api_key_prefix?: string | null
          api_user_id?: string | null
          api_version?: string | null
          application_name?: string | null
          duration_ms?: number | null
          endpoint?: string
          http_method?: string
          id?: string
          level?: Database["public"]["Enums"]["api_log_level"]
          message?: string | null
          occurred_at?: string
          outcome?: string | null
          request_bytes?: number | null
          request_id?: string
          response_bytes?: number | null
          source_ip?: string | null
          status_code?: number | null
        }
        Relationships: []
      }
      api_role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_code: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_code: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_code?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_role_permissions_permission_code_fkey"
            columns: ["permission_code"]
            isOneToOne: false
            referencedRelation: "api_permissions"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "api_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "api_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_roles: {
        Row: {
          created_at: string
          description: string
          id: string
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_settings: {
        Row: {
          allow_hard_delete_users: boolean
          api_key_ttl_days: number
          audit_retention_days: number
          default_limit_per_day: number
          default_limit_per_hour: number
          default_limit_per_minute: number
          id: boolean
          jwt_ttl_minutes: number
          lockout_policy: string
          log_retention_days: number
          max_response_ms: number
          min_log_level: Database["public"]["Enums"]["api_log_level"]
          updated_at: string
        }
        Insert: {
          allow_hard_delete_users?: boolean
          api_key_ttl_days?: number
          audit_retention_days?: number
          default_limit_per_day?: number
          default_limit_per_hour?: number
          default_limit_per_minute?: number
          id?: boolean
          jwt_ttl_minutes?: number
          lockout_policy?: string
          log_retention_days?: number
          max_response_ms?: number
          min_log_level?: Database["public"]["Enums"]["api_log_level"]
          updated_at?: string
        }
        Update: {
          allow_hard_delete_users?: boolean
          api_key_ttl_days?: number
          audit_retention_days?: number
          default_limit_per_day?: number
          default_limit_per_hour?: number
          default_limit_per_minute?: number
          id?: boolean
          jwt_ttl_minutes?: number
          lockout_policy?: string
          log_retention_days?: number
          max_response_ms?: number
          min_log_level?: Database["public"]["Enums"]["api_log_level"]
          updated_at?: string
        }
        Relationships: []
      }
      api_user_roles: {
        Row: {
          api_user_id: string
          created_at: string
          id: string
          role_id: string
        }
        Insert: {
          api_user_id: string
          created_at?: string
          id?: string
          role_id: string
        }
        Update: {
          api_user_id?: string
          created_at?: string
          id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_user_roles_api_user_id_fkey"
            columns: ["api_user_id"]
            isOneToOne: false
            referencedRelation: "api_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "api_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      api_users: {
        Row: {
          created_at: string
          created_by_api_key: string | null
          deleted_at: string | null
          email: string
          external_id: string | null
          full_name: string
          id: string
          metadata: Json
          phone: string | null
          status: Database["public"]["Enums"]["api_user_status"]
          status_reason: string | null
          suspended_until: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by_api_key?: string | null
          deleted_at?: string | null
          email: string
          external_id?: string | null
          full_name?: string
          id?: string
          metadata?: Json
          phone?: string | null
          status?: Database["public"]["Enums"]["api_user_status"]
          status_reason?: string | null
          suspended_until?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by_api_key?: string | null
          deleted_at?: string | null
          email?: string
          external_id?: string | null
          full_name?: string
          id?: string
          metadata?: Json
          phone?: string | null
          status?: Database["public"]["Enums"]["api_user_status"]
          status_reason?: string | null
          suspended_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      api_versions: {
        Row: {
          code: string
          created_at: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["api_version_status"]
          sunset_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["api_version_status"]
          sunset_date?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["api_version_status"]
          sunset_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
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
      api_register_hit: {
        Args: { _api_key_id: string; _kind: string; _window_start: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      api_key_status: "active" | "suspended" | "revoked" | "expired"
      api_log_level: "info" | "warning" | "error" | "critical"
      api_user_status:
        | "active"
        | "suspended"
        | "pending"
        | "blocked"
        | "deleted"
      api_version_status: "active" | "deprecated" | "disabled"
      app_role: "admin" | "viewer"
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
      api_key_status: ["active", "suspended", "revoked", "expired"],
      api_log_level: ["info", "warning", "error", "critical"],
      api_user_status: ["active", "suspended", "pending", "blocked", "deleted"],
      api_version_status: ["active", "deprecated", "disabled"],
      app_role: ["admin", "viewer"],
    },
  },
} as const
