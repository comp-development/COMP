export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  auth: {
    Tables: {
      audit_log_entries: {
        Row: {
          created_at: string | null
          id: string
          instance_id: string | null
          ip_address: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          id: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          instance_id?: string | null
          ip_address?: string
          payload?: Json | null
        }
        Relationships: []
      }
      flow_state: {
        Row: {
          auth_code: string
          auth_code_issued_at: string | null
          authentication_method: string
          code_challenge: string
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"]
          created_at: string | null
          id: string
          provider_access_token: string | null
          provider_refresh_token: string | null
          provider_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          auth_code: string
          auth_code_issued_at?: string | null
          authentication_method: string
          code_challenge: string
          code_challenge_method: Database["auth"]["Enums"]["code_challenge_method"]
          created_at?: string | null
          id: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          auth_code?: string
          auth_code_issued_at?: string | null
          authentication_method?: string
          code_challenge?: string
          code_challenge_method?: Database["auth"]["Enums"]["code_challenge_method"]
          created_at?: string | null
          id?: string
          provider_access_token?: string | null
          provider_refresh_token?: string | null
          provider_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      identities: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          identity_data: Json
          last_sign_in_at: string | null
          provider: string
          provider_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data: Json
          last_sign_in_at?: string | null
          provider: string
          provider_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          identity_data?: Json
          last_sign_in_at?: string | null
          provider?: string
          provider_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "identities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      instances: {
        Row: {
          created_at: string | null
          id: string
          raw_base_config: string | null
          updated_at: string | null
          uuid: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          raw_base_config?: string | null
          updated_at?: string | null
          uuid?: string | null
        }
        Relationships: []
      }
      mfa_amr_claims: {
        Row: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Insert: {
          authentication_method: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
        }
        Update: {
          authentication_method?: string
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_amr_claims_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_challenges: {
        Row: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code: string | null
          verified_at: string | null
          web_authn_session_data: Json | null
        }
        Insert: {
          created_at: string
          factor_id: string
          id: string
          ip_address: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Update: {
          created_at?: string
          factor_id?: string
          id?: string
          ip_address?: unknown
          otp_code?: string | null
          verified_at?: string | null
          web_authn_session_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_challenges_auth_factor_id_fkey"
            columns: ["factor_id"]
            isOneToOne: false
            referencedRelation: "mfa_factors"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_factors: {
        Row: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name: string | null
          id: string
          last_challenged_at: string | null
          phone: string | null
          secret: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid: string | null
          web_authn_credential: Json | null
        }
        Insert: {
          created_at: string
          factor_type: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id: string
          last_challenged_at?: string | null
          phone?: string | null
          secret?: string | null
          status: Database["auth"]["Enums"]["factor_status"]
          updated_at: string
          user_id: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Update: {
          created_at?: string
          factor_type?: Database["auth"]["Enums"]["factor_type"]
          friendly_name?: string | null
          id?: string
          last_challenged_at?: string | null
          phone?: string | null
          secret?: string | null
          status?: Database["auth"]["Enums"]["factor_status"]
          updated_at?: string
          user_id?: string
          web_authn_aaguid?: string | null
          web_authn_credential?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "mfa_factors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      one_time_tokens: {
        Row: {
          created_at: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          relates_to: string
          token_hash: string
          token_type: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          relates_to?: string
          token_hash?: string
          token_type?: Database["auth"]["Enums"]["one_time_token_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_time_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          created_at: string | null
          id: number
          instance_id: string | null
          parent: string | null
          revoked: boolean | null
          session_id: string | null
          token: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          instance_id?: string | null
          parent?: string | null
          revoked?: boolean | null
          session_id?: string | null
          token?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_providers: {
        Row: {
          attribute_mapping: Json | null
          created_at: string | null
          entity_id: string
          id: string
          metadata_url: string | null
          metadata_xml: string
          name_id_format: string | null
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id: string
          id: string
          metadata_url?: string | null
          metadata_xml: string
          name_id_format?: string | null
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          attribute_mapping?: Json | null
          created_at?: string | null
          entity_id?: string
          id?: string
          metadata_url?: string | null
          metadata_xml?: string
          name_id_format?: string | null
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_providers_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      saml_relay_states: {
        Row: {
          created_at: string | null
          flow_state_id: string | null
          for_email: string | null
          id: string
          redirect_to: string | null
          request_id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id: string
          redirect_to?: string | null
          request_id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          flow_state_id?: string | null
          for_email?: string | null
          id?: string
          redirect_to?: string | null
          request_id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saml_relay_states_flow_state_id_fkey"
            columns: ["flow_state_id"]
            isOneToOne: false
            referencedRelation: "flow_state"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saml_relay_states_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      schema_migrations: {
        Row: {
          version: string
        }
        Insert: {
          version: string
        }
        Update: {
          version?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          aal: Database["auth"]["Enums"]["aal_level"] | null
          created_at: string | null
          factor_id: string | null
          id: string
          ip: unknown | null
          not_after: string | null
          refreshed_at: string | null
          tag: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id: string
          ip?: unknown | null
          not_after?: string | null
          refreshed_at?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          aal?: Database["auth"]["Enums"]["aal_level"] | null
          created_at?: string | null
          factor_id?: string | null
          id?: string
          ip?: unknown | null
          not_after?: string | null
          refreshed_at?: string | null
          tag?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_domains: {
        Row: {
          created_at: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          id: string
          sso_provider_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          id?: string
          sso_provider_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sso_domains_sso_provider_id_fkey"
            columns: ["sso_provider_id"]
            isOneToOne: false
            referencedRelation: "sso_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      sso_providers: {
        Row: {
          created_at: string | null
          id: string
          resource_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          resource_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          aud: string | null
          banned_until: string | null
          confirmation_sent_at: string | null
          confirmation_token: string | null
          confirmed_at: string | null
          created_at: string | null
          deleted_at: string | null
          email: string | null
          email_change: string | null
          email_change_confirm_status: number | null
          email_change_sent_at: string | null
          email_change_token_current: string | null
          email_change_token_new: string | null
          email_confirmed_at: string | null
          encrypted_password: string | null
          id: string
          instance_id: string | null
          invited_at: string | null
          is_anonymous: boolean
          is_sso_user: boolean
          is_super_admin: boolean | null
          last_sign_in_at: string | null
          phone: string | null
          phone_change: string | null
          phone_change_sent_at: string | null
          phone_change_token: string | null
          phone_confirmed_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          reauthentication_sent_at: string | null
          reauthentication_token: string | null
          recovery_sent_at: string | null
          recovery_token: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          aud?: string | null
          banned_until?: string | null
          confirmation_sent_at?: string | null
          confirmation_token?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          deleted_at?: string | null
          email?: string | null
          email_change?: string | null
          email_change_confirm_status?: number | null
          email_change_sent_at?: string | null
          email_change_token_current?: string | null
          email_change_token_new?: string | null
          email_confirmed_at?: string | null
          encrypted_password?: string | null
          id?: string
          instance_id?: string | null
          invited_at?: string | null
          is_anonymous?: boolean
          is_sso_user?: boolean
          is_super_admin?: boolean | null
          last_sign_in_at?: string | null
          phone?: string | null
          phone_change?: string | null
          phone_change_sent_at?: string | null
          phone_change_token?: string | null
          phone_confirmed_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          reauthentication_sent_at?: string | null
          reauthentication_token?: string | null
          recovery_sent_at?: string | null
          recovery_token?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      jwt: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      aal_level: "aal1" | "aal2" | "aal3"
      code_challenge_method: "s256" | "plain"
      factor_status: "unverified" | "verified"
      factor_type: "totp" | "webauthn" | "phone"
      one_time_token_type:
        | "confirmation_token"
        | "reauthentication_token"
        | "recovery_token"
        | "email_change_token_new"
        | "email_change_token_current"
        | "phone_change_token"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admins: {
        Row: {
          admin_id: string
          first_name: string | null
          last_name: string | null
        }
        Insert: {
          admin_id: string
          first_name?: string | null
          last_name?: string | null
        }
        Update: {
          admin_id?: string
          first_name?: string | null
          last_name?: string | null
        }
        Relationships: []
      }
      coaches: {
        Row: {
          coach_id: number
          created_at: string
          first_name: string | null
          last_name: string | null
          org_id: number | null
        }
        Insert: {
          coach_id?: number
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          org_id?: number | null
        }
        Update: {
          coach_id?: number
          created_at?: string
          first_name?: string | null
          last_name?: string | null
          org_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "coaches_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["org_id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          choices: string[] | null
          custom_field_id: number
          editable: boolean | null
          event_id: number | null
          help_text: string | null
          hidden: boolean | null
          key: string
          label: string
          regex: string | null
          required: boolean | null
          type: Database["public"]["Enums"]["custom_field_type"]
        }
        Insert: {
          choices?: string[] | null
          custom_field_id?: number
          editable?: boolean | null
          event_id?: number | null
          help_text?: string | null
          hidden?: boolean | null
          key: string
          label: string
          regex?: string | null
          required?: boolean | null
          type: Database["public"]["Enums"]["custom_field_type"]
        }
        Update: {
          choices?: string[] | null
          custom_field_id?: number
          editable?: boolean | null
          event_id?: number | null
          help_text?: string | null
          hidden?: boolean | null
          key?: string
          label?: string
          regex?: string | null
          required?: boolean | null
          type?: Database["public"]["Enums"]["custom_field_type"]
        }
        Relationships: [
          {
            foreignKeyName: "custom_fields_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      events: {
        Row: {
          event_date: string | null
          event_id: number
          event_name: string | null
          host_id: number
          published: boolean
          ticket_price_cents: number
        }
        Insert: {
          event_date?: string | null
          event_id?: number
          event_name?: string | null
          host_id: number
          published?: boolean
          ticket_price_cents: number
        }
        Update: {
          event_date?: string | null
          event_id?: number
          event_name?: string | null
          host_id?: number
          published?: boolean
          ticket_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "events_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "hosts"
            referencedColumns: ["host_id"]
          },
        ]
      }
      graded_answers: {
        Row: {
          answer_latex: string | null
          correct: boolean | null
          graded_answer_id: number
          problem_id: number
        }
        Insert: {
          answer_latex?: string | null
          correct?: boolean | null
          graded_answer_id?: number
          problem_id?: number
        }
        Update: {
          answer_latex?: string | null
          correct?: boolean | null
          graded_answer_id?: number
          problem_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "graded_answers_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["problem_id"]
          },
        ]
      }
      hosts: {
        Row: {
          host_id: number
          host_name: string | null
        }
        Insert: {
          host_id?: number
          host_name?: string | null
        }
        Update: {
          host_id?: number
          host_name?: string | null
        }
        Relationships: []
      }
      org_events: {
        Row: {
          created_at: string
          custom_fields: Json
          event_id: number | null
          id: number
          join_code: string | null
          org_id: number | null
        }
        Insert: {
          created_at?: string
          custom_fields?: Json
          event_id?: number | null
          id?: number
          join_code?: string | null
          org_id?: number | null
        }
        Update: {
          created_at?: string
          custom_fields?: Json
          event_id?: number | null
          id?: number
          join_code?: string | null
          org_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "org_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "org_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["org_id"]
          },
        ]
      }
      orgs: {
        Row: {
          address: Json | null
          created_at: string
          name: string | null
          org_id: number
        }
        Insert: {
          address?: Json | null
          created_at?: string
          name?: string | null
          org_id?: number
        }
        Update: {
          address?: Json | null
          created_at?: string
          name?: string | null
          org_id?: number
        }
        Relationships: []
      }
      problem_clarifications: {
        Row: {
          clarification_id: number
          clarification_latex: string | null
          test_problem_id: number
        }
        Insert: {
          clarification_id?: number
          clarification_latex?: string | null
          test_problem_id: number
        }
        Update: {
          clarification_id?: number
          clarification_latex?: string | null
          test_problem_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "problem_clarifications_test_problem_id_fkey"
            columns: ["test_problem_id"]
            isOneToOne: false
            referencedRelation: "test_problems"
            referencedColumns: ["test_problem_id"]
          },
        ]
      }
      problems: {
        Row: {
          answer_latex: string | null
          answer_type: Database["public"]["Enums"]["answer_type"]
          problem_id: number
          problem_latex: string
          solution_latex: string | null
        }
        Insert: {
          answer_latex?: string | null
          answer_type?: Database["public"]["Enums"]["answer_type"]
          problem_id?: number
          problem_latex: string
          solution_latex?: string | null
        }
        Update: {
          answer_latex?: string | null
          answer_type?: Database["public"]["Enums"]["answer_type"]
          problem_id?: number
          problem_latex?: string
          solution_latex?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: number
          settings: Json
        }
        Insert: {
          id?: number
          settings: Json
        }
        Update: {
          id?: number
          settings?: Json
        }
        Relationships: []
      }
      student_custom_fields: {
        Row: {
          custom_field_id: number
          response: Json | null
          student_id: string
        }
        Insert: {
          custom_field_id: number
          response?: Json | null
          student_id: string
        }
        Update: {
          custom_field_id?: number
          response?: Json | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_custom_fields_custom_field_id_fkey"
            columns: ["custom_field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["custom_field_id"]
          },
          {
            foreignKeyName: "student_custom_fields_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_org_events: {
        Row: {
          joined_at: string
          org_event_id: number
          student_id: string
        }
        Insert: {
          joined_at?: string
          org_event_id: number
          student_id: string
        }
        Update: {
          joined_at?: string
          org_event_id?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_event_orgs_event_id_fkey"
            columns: ["org_event_id"]
            isOneToOne: false
            referencedRelation: "org_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_event_orgs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      student_teams: {
        Row: {
          division: string | null
          front_id: string | null
          relation_id: number
          student_id: string
          team_id: number
          ticket_order_id: number
        }
        Insert: {
          division?: string | null
          front_id?: string | null
          relation_id?: number
          student_id: string
          team_id: number
          ticket_order_id: number
        }
        Update: {
          division?: string | null
          front_id?: string | null
          relation_id?: number
          student_id?: string
          team_id?: number
          ticket_order_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "student_teams_order_id_fkey"
            columns: ["ticket_order_id"]
            isOneToOne: false
            referencedRelation: "ticket_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          contestdojo_id: string | null
          first_name: string | null
          grade: string | null
          last_log_in: string | null
          last_name: string | null
          student_id: string
        }
        Insert: {
          contestdojo_id?: string | null
          first_name?: string | null
          grade?: string | null
          last_log_in?: string | null
          last_name?: string | null
          student_id: string
        }
        Update: {
          contestdojo_id?: string | null
          first_name?: string | null
          grade?: string | null
          last_log_in?: string | null
          last_name?: string | null
          student_id?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          contestdojo_id: string | null
          custom_fields: Json
          division: string | null
          event_id: number
          front_id: string | null
          join_code: string | null
          org_id: number | null
          team_id: number
          team_name: string | null
        }
        Insert: {
          contestdojo_id?: string | null
          custom_fields?: Json
          division?: string | null
          event_id: number
          front_id?: string | null
          join_code?: string | null
          org_id?: number | null
          team_id?: number
          team_name?: string | null
        }
        Update: {
          contestdojo_id?: string | null
          custom_fields?: Json
          division?: string | null
          event_id?: number
          front_id?: string | null
          join_code?: string | null
          org_id?: number | null
          team_id?: number
          team_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "teams_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["org_id"]
          },
        ]
      }
      test_answers: {
        Row: {
          answer_latex: string | null
          last_edited_time: string | null
          test_answer_id: number
          test_problem_id: number
          test_taker_id: number
        }
        Insert: {
          answer_latex?: string | null
          last_edited_time?: string | null
          test_answer_id?: number
          test_problem_id: number
          test_taker_id: number
        }
        Update: {
          answer_latex?: string | null
          last_edited_time?: string | null
          test_answer_id?: number
          test_problem_id?: number
          test_taker_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_answers_test_problem_id_fkey"
            columns: ["test_problem_id"]
            isOneToOne: false
            referencedRelation: "test_problems"
            referencedColumns: ["test_problem_id"]
          },
          {
            foreignKeyName: "test_answers_test_taker_id_fkey"
            columns: ["test_taker_id"]
            isOneToOne: false
            referencedRelation: "test_takers"
            referencedColumns: ["test_taker_id"]
          },
          {
            foreignKeyName: "test_answers_test_taker_id_fkey"
            columns: ["test_taker_id"]
            isOneToOne: false
            referencedRelation: "test_takers_detailed"
            referencedColumns: ["test_taker_id"]
          },
        ]
      }
      test_problems: {
        Row: {
          name: string | null
          page_number: number
          points: number | null
          problem_id: number
          problem_number: number
          test_id: number
          test_problem_id: number
        }
        Insert: {
          name?: string | null
          page_number?: number
          points?: number | null
          problem_id: number
          problem_number: number
          test_id: number
          test_problem_id?: number
        }
        Update: {
          name?: string | null
          page_number?: number
          points?: number | null
          problem_id?: number
          problem_number?: number
          test_id?: number
          test_problem_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_problems_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["problem_id"]
          },
          {
            foreignKeyName: "test_problems_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "graded_test_answers"
            referencedColumns: ["test_id"]
          },
          {
            foreignKeyName: "test_problems_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "guts_tests"
            referencedColumns: ["test_id"]
          },
          {
            foreignKeyName: "test_problems_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["test_id"]
          },
          {
            foreignKeyName: "test_problems_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests_detailed"
            referencedColumns: ["test_id"]
          },
        ]
      }
      test_takers: {
        Row: {
          end_time: string | null
          page_number: number
          start_time: string | null
          student_id: string | null
          team_id: number | null
          test_id: number
          test_taker_id: number
        }
        Insert: {
          end_time?: string | null
          page_number?: number
          start_time?: string | null
          student_id?: string | null
          team_id?: number | null
          test_id: number
          test_taker_id?: number
        }
        Update: {
          end_time?: string | null
          page_number?: number
          start_time?: string | null
          student_id?: string | null
          team_id?: number | null
          test_id?: number
          test_taker_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_takers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "test_takers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "test_takers_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "graded_test_answers"
            referencedColumns: ["test_id"]
          },
          {
            foreignKeyName: "test_takers_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "guts_tests"
            referencedColumns: ["test_id"]
          },
          {
            foreignKeyName: "test_takers_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["test_id"]
          },
          {
            foreignKeyName: "test_takers_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests_detailed"
            referencedColumns: ["test_id"]
          },
        ]
      }
      tests: {
        Row: {
          access_rules: Json | null
          buffer_time: number | null
          division: string | null
          event_id: number
          instructions: string | null
          is_team: boolean
          length: number
          opening_time: string | null
          release_results: boolean
          settings: Json | null
          test_id: number
          test_mode: Database["public"]["Enums"]["test_mode"]
          test_name: string | null
          visible: boolean
        }
        Insert: {
          access_rules?: Json | null
          buffer_time?: number | null
          division?: string | null
          event_id: number
          instructions?: string | null
          is_team?: boolean
          length?: number
          opening_time?: string | null
          release_results?: boolean
          settings?: Json | null
          test_id?: number
          test_mode?: Database["public"]["Enums"]["test_mode"]
          test_name?: string | null
          visible?: boolean
        }
        Update: {
          access_rules?: Json | null
          buffer_time?: number | null
          division?: string | null
          event_id?: number
          instructions?: string | null
          is_team?: boolean
          length?: number
          opening_time?: string | null
          release_results?: boolean
          settings?: Json | null
          test_id?: number
          test_mode?: Database["public"]["Enums"]["test_mode"]
          test_name?: string | null
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "tests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      ticket_orders: {
        Row: {
          created_at: string
          event_id: number
          id: number
          order_id: string
          org_id: number | null
          quantity: number
          student_id: string | null
        }
        Insert: {
          created_at?: string
          event_id: number
          id?: number
          order_id: string
          org_id?: number | null
          quantity: number
          student_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: number
          id?: number
          order_id?: string
          org_id?: number | null
          quantity?: number
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "ticket_orders_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "ticket_orders_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
    }
    Views: {
      graded_answer_count: {
        Row: {
          answer_latex: string | null
          correct: boolean | null
          count: number | null
          graded_answer_id: number | null
          problem_id: number | null
          test_problem_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_answers_test_problem_id_fkey"
            columns: ["test_problem_id"]
            isOneToOne: false
            referencedRelation: "test_problems"
            referencedColumns: ["test_problem_id"]
          },
          {
            foreignKeyName: "test_problems_problem_id_fkey"
            columns: ["problem_id"]
            isOneToOne: false
            referencedRelation: "problems"
            referencedColumns: ["problem_id"]
          },
        ]
      }
      graded_test_answers: {
        Row: {
          answer_latex: string | null
          correct: boolean | null
          last_edited_time: string | null
          points: number | null
          test_answer_id: number | null
          test_id: number | null
          test_name: string | null
          test_problem_id: number | null
          test_problem_number: number | null
          test_problem_page: number | null
          test_taker_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_answers_test_problem_id_fkey"
            columns: ["test_problem_id"]
            isOneToOne: false
            referencedRelation: "test_problems"
            referencedColumns: ["test_problem_id"]
          },
          {
            foreignKeyName: "test_answers_test_taker_id_fkey"
            columns: ["test_taker_id"]
            isOneToOne: false
            referencedRelation: "test_takers"
            referencedColumns: ["test_taker_id"]
          },
          {
            foreignKeyName: "test_answers_test_taker_id_fkey"
            columns: ["test_taker_id"]
            isOneToOne: false
            referencedRelation: "test_takers_detailed"
            referencedColumns: ["test_taker_id"]
          },
        ]
      }
      guts_tests: {
        Row: {
          buffer_time: number | null
          division: string | null
          event_id: number | null
          event_name: string | null
          instructions: string | null
          is_team: boolean | null
          length: number | null
          opening_time: string | null
          release_results: boolean | null
          settings: Json | null
          test_id: number | null
          test_mode: Database["public"]["Enums"]["test_mode"] | null
          test_name: string | null
          visble: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      student_events_detailed: {
        Row: {
          division: string | null
          email: string | null
          event_id: number | null
          first_name: string | null
          front_id: string | null
          last_name: string | null
          org_id: number | null
          relation_id: number | null
          student_id: string | null
          team_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "student_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "teams_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "teams_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["org_id"]
          },
        ]
      }
      test_takers_detailed: {
        Row: {
          division: string | null
          end_time: string | null
          event_name: string | null
          front_id: string | null
          page_number: number | null
          start_time: string | null
          student_id: string | null
          taker_name: string | null
          team_id: number | null
          test_id: number | null
          test_name: string | null
          test_taker_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_takers_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "test_takers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "test_takers_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "graded_test_answers"
            referencedColumns: ["test_id"]
          },
          {
            foreignKeyName: "test_takers_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "guts_tests"
            referencedColumns: ["test_id"]
          },
          {
            foreignKeyName: "test_takers_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["test_id"]
          },
          {
            foreignKeyName: "test_takers_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests_detailed"
            referencedColumns: ["test_id"]
          },
        ]
      }
      tests_detailed: {
        Row: {
          buffer_time: number | null
          division: string | null
          event_id: number | null
          event_name: string | null
          instructions: string | null
          is_team: boolean | null
          length: number | null
          num_pages: number | null
          num_problems: number | null
          opening_time: string | null
          release_results: boolean | null
          settings: Json | null
          test_id: number | null
          test_mode: Database["public"]["Enums"]["test_mode"] | null
          test_name: string | null
          visible: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["event_id"]
          },
        ]
      }
    }
    Functions: {
      add_test_taker: {
        Args: {
          p_test_id: number
        }
        Returns: string
      }
      change_page: {
        Args: {
          p_test_taker_id: number
          p_page_number: number
        }
        Returns: string
      }
      check_org_event_pair_exists: {
        Args: {
          in_org_id: number
          in_event_id: number
        }
        Returns: boolean
      }
      check_teammate: {
        Args: {
          p_student_id: string
        }
        Returns: boolean
      }
      check_test_access: {
        Args: {
          p_test_id: number
        }
        Returns: boolean
      }
      evaluate_access_rules: {
        Args: {
          student_id: string
          rules_json: Json
        }
        Returns: boolean
      }
      fetch_test_problems: {
        Args: {
          p_test_taker_id: number
        }
        Returns: Json[]
      }
      get_students_with_access: {
        Args: {
          p_test_id: number
        }
        Returns: {
          student_id: string
          first_name: string
          last_name: string
          email: string
          division: string
        }[]
      }
      student_team_requirements: {
        Args: {
          in_student_id: string
          in_team_id: number
          in_ticket_order_id: number
        }
        Returns: boolean
      }
      upsert_test_answer: {
        Args: {
          p_test_taker_id: number
          p_test_problem_id: number
          p_answer: string
        }
        Returns: string
      }
      verify_auth: {
        Args: {
          tt_id: number
          stud_id: string
        }
        Returns: boolean
      }
      verify_test_taker_access: {
        Args: {
          p_test_taker_id: number
          p_student_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      answer_type: "AsciiMath" | "Text" | "Integer" | "Decimal"
      custom_field_type: "students" | "teams" | "orgs"
      test_mode: "Standard" | "Puzzle" | "Guts" | "Meltdown"
    }
    CompositeTypes: {
      add_test_taker_result: {
        success: boolean | null
        message: string | null
        test_taker_id: number | null
      }
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

