export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  core: {
    Tables: {
      audit_events: {
        Row: {
          action_key: string;
          actor_kind: Database["core"]["Enums"]["audit_actor_kind"];
          actor_user_id: string | null;
          business_id: string | null;
          entity_id: string | null;
          entity_type: string | null;
          id: string;
          metadata: Json;
          occurred_at: string;
        };
        Insert: {
          action_key: string;
          actor_kind: Database["core"]["Enums"]["audit_actor_kind"];
          actor_user_id?: string | null;
          business_id?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json;
          occurred_at?: string;
        };
        Update: {
          action_key?: string;
          actor_kind?: Database["core"]["Enums"]["audit_actor_kind"];
          actor_user_id?: string | null;
          business_id?: string | null;
          entity_id?: string | null;
          entity_type?: string | null;
          id?: string;
          metadata?: Json;
          occurred_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_events_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      business_domains: {
        Row: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          hostname: string;
          id: string;
          is_primary: boolean;
          routing_checked_at: string | null;
          routing_live_at: string | null;
          routing_status: Database["core"]["Enums"]["domain_routing_status"];
          status: Database["core"]["Enums"]["domain_status"];
          target_module_key: string | null;
          updated_at: string;
          verification_checked_at: string | null;
          verification_method: Database["core"]["Enums"]["domain_verification_method"];
          verification_token: string;
          verified_at: string | null;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          hostname: string;
          id?: string;
          is_primary?: boolean;
          routing_checked_at?: string | null;
          routing_live_at?: string | null;
          routing_status?: Database["core"]["Enums"]["domain_routing_status"];
          status?: Database["core"]["Enums"]["domain_status"];
          target_module_key?: string | null;
          updated_at?: string;
          verification_checked_at?: string | null;
          verification_method?: Database["core"]["Enums"]["domain_verification_method"];
          verification_token: string;
          verified_at?: string | null;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          hostname?: string;
          id?: string;
          is_primary?: boolean;
          routing_checked_at?: string | null;
          routing_live_at?: string | null;
          routing_status?: Database["core"]["Enums"]["domain_routing_status"];
          status?: Database["core"]["Enums"]["domain_status"];
          target_module_key?: string | null;
          updated_at?: string;
          verification_checked_at?: string | null;
          verification_method?: Database["core"]["Enums"]["domain_verification_method"];
          verification_token?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "business_domains_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_domains_target_module_key_fkey";
            columns: ["target_module_key"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["key"];
          },
        ];
      };
      business_locales: {
        Row: {
          business_id: string;
          created_at: string;
          is_enabled: boolean;
          locale_code: Database["core"]["Enums"]["locale_code"];
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          is_enabled?: boolean;
          locale_code: Database["core"]["Enums"]["locale_code"];
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          is_enabled?: boolean;
          locale_code?: Database["core"]["Enums"]["locale_code"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "business_locales_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      business_modules: {
        Row: {
          business_id: string;
          created_at: string;
          is_enabled: boolean;
          module_key: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          is_enabled?: boolean;
          module_key: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          is_enabled?: boolean;
          module_key?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "business_modules_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_modules_module_key_fkey";
            columns: ["module_key"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["key"];
          },
        ];
      };
      business_visual_settings: {
        Row: {
          business_id: string;
          created_at: string;
          module_key: string;
          template_key: string;
          theme_overrides: Json;
          theme_schema_version: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          module_key: string;
          template_key: string;
          theme_overrides?: Json;
          theme_schema_version?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          module_key?: string;
          template_key?: string;
          theme_overrides?: Json;
          theme_schema_version?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "business_visual_settings_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "business_visual_settings_module_key_fkey";
            columns: ["module_key"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["key"];
          },
          {
            foreignKeyName: "business_visual_settings_template_fk";
            columns: ["module_key", "template_key"];
            isOneToOne: false;
            referencedRelation: "templates";
            referencedColumns: ["module_key", "key"];
          },
        ];
      };
      businesses: {
        Row: {
          created_at: string;
          created_by: string | null;
          currency_code: string;
          default_locale: Database["core"]["Enums"]["locale_code"];
          display_name: string;
          id: string;
          slug: string;
          status: Database["core"]["Enums"]["business_status"];
          timezone: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          currency_code?: string;
          default_locale: Database["core"]["Enums"]["locale_code"];
          display_name: string;
          id?: string;
          slug: string;
          status?: Database["core"]["Enums"]["business_status"];
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          currency_code?: string;
          default_locale?: Database["core"]["Enums"]["locale_code"];
          display_name?: string;
          id?: string;
          slug?: string;
          status?: Database["core"]["Enums"]["business_status"];
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      locations: {
        Row: {
          address_line: string | null;
          business_id: string;
          country_code: string;
          created_at: string;
          created_by: string | null;
          display_name: string;
          id: string;
          locality: string | null;
          postal_code: string | null;
          status: Database["core"]["Enums"]["location_status"];
          timezone: string | null;
          updated_at: string;
        };
        Insert: {
          address_line?: string | null;
          business_id: string;
          country_code?: string;
          created_at?: string;
          created_by?: string | null;
          display_name: string;
          id?: string;
          locality?: string | null;
          postal_code?: string | null;
          status?: Database["core"]["Enums"]["location_status"];
          timezone?: string | null;
          updated_at?: string;
        };
        Update: {
          address_line?: string | null;
          business_id?: string;
          country_code?: string;
          created_at?: string;
          created_by?: string | null;
          display_name?: string;
          id?: string;
          locality?: string | null;
          postal_code?: string | null;
          status?: Database["core"]["Enums"]["location_status"];
          timezone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "locations_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      media_assets: {
        Row: {
          alt_text: string | null;
          business_id: string;
          byte_size: number;
          created_at: string;
          created_by: string | null;
          duration_ms: number | null;
          height: number | null;
          id: string;
          media_kind: Database["core"]["Enums"]["media_kind"];
          mime_type: string;
          original_filename: string;
          status: Database["core"]["Enums"]["media_status"];
          storage_bucket: string;
          storage_path: string;
          updated_at: string;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          business_id: string;
          byte_size: number;
          created_at?: string;
          created_by?: string | null;
          duration_ms?: number | null;
          height?: number | null;
          id?: string;
          media_kind: Database["core"]["Enums"]["media_kind"];
          mime_type: string;
          original_filename: string;
          status?: Database["core"]["Enums"]["media_status"];
          storage_bucket: string;
          storage_path: string;
          updated_at?: string;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          business_id?: string;
          byte_size?: number;
          created_at?: string;
          created_by?: string | null;
          duration_ms?: number | null;
          height?: number | null;
          id?: string;
          media_kind?: Database["core"]["Enums"]["media_kind"];
          mime_type?: string;
          original_filename?: string;
          status?: Database["core"]["Enums"]["media_status"];
          storage_bucket?: string;
          storage_path?: string;
          updated_at?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "media_assets_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      membership_permissions: {
        Row: {
          business_id: string;
          granted_at: string;
          granted_by: string | null;
          id: string;
          location_id: string | null;
          membership_id: string;
          permission_key: string;
        };
        Insert: {
          business_id: string;
          granted_at?: string;
          granted_by?: string | null;
          id?: string;
          location_id?: string | null;
          membership_id: string;
          permission_key: string;
        };
        Update: {
          business_id?: string;
          granted_at?: string;
          granted_by?: string | null;
          id?: string;
          location_id?: string | null;
          membership_id?: string;
          permission_key?: string;
        };
        Relationships: [
          {
            foreignKeyName: "membership_permissions_location_fk";
            columns: ["business_id", "location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "membership_permissions_membership_fk";
            columns: ["business_id", "membership_id"];
            isOneToOne: false;
            referencedRelation: "memberships";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "membership_permissions_permission_key_fkey";
            columns: ["permission_key"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["key"];
          },
        ];
      };
      memberships: {
        Row: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          joined_at: string;
          status: Database["core"]["Enums"]["membership_status"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          joined_at?: string;
          status?: Database["core"]["Enums"]["membership_status"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          joined_at?: string;
          status?: Database["core"]["Enums"]["membership_status"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "memberships_business_id_fkey";
            columns: ["business_id"];
            isOneToOne: false;
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      modules: {
        Row: {
          created_at: string;
          description: string;
          display_name: string;
          is_available: boolean;
          key: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          description: string;
          display_name: string;
          is_available?: boolean;
          key: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          description?: string;
          display_name?: string;
          is_available?: boolean;
          key?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      permissions: {
        Row: {
          created_at: string;
          description: string;
          key: string;
          module_key: string | null;
          scope: Database["core"]["Enums"]["permission_scope"];
        };
        Insert: {
          created_at?: string;
          description: string;
          key: string;
          module_key?: string | null;
          scope: Database["core"]["Enums"]["permission_scope"];
        };
        Update: {
          created_at?: string;
          description?: string;
          key?: string;
          module_key?: string | null;
          scope?: Database["core"]["Enums"]["permission_scope"];
        };
        Relationships: [
          {
            foreignKeyName: "permissions_module_key_fkey";
            columns: ["module_key"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["key"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          preferred_locale: Database["core"]["Enums"]["locale_code"] | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          preferred_locale?: Database["core"]["Enums"]["locale_code"] | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          preferred_locale?: Database["core"]["Enums"]["locale_code"] | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      templates: {
        Row: {
          created_at: string;
          default_theme: Json;
          description: string;
          display_name: string;
          is_available: boolean;
          is_default: boolean;
          key: string;
          module_key: string;
          sort_order: number;
          template_version: number;
          theme_schema_version: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          default_theme: Json;
          description: string;
          display_name: string;
          is_available?: boolean;
          is_default?: boolean;
          key: string;
          module_key: string;
          sort_order?: number;
          template_version?: number;
          theme_schema_version?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          default_theme?: Json;
          description?: string;
          display_name?: string;
          is_available?: boolean;
          is_default?: boolean;
          key?: string;
          module_key?: string;
          sort_order?: number;
          template_version?: number;
          theme_schema_version?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "templates_module_key_fkey";
            columns: ["module_key"];
            isOneToOne: false;
            referencedRelation: "modules";
            referencedColumns: ["key"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_business_domain: {
        Args: { requested_hostname: string; target_business_id: string };
        Returns: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          hostname: string;
          id: string;
          is_primary: boolean;
          routing_checked_at: string | null;
          routing_live_at: string | null;
          routing_status: Database["core"]["Enums"]["domain_routing_status"];
          status: Database["core"]["Enums"]["domain_status"];
          target_module_key: string | null;
          updated_at: string;
          verification_checked_at: string | null;
          verification_method: Database["core"]["Enums"]["domain_verification_method"];
          verification_token: string;
          verified_at: string | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "business_domains";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      archive_location: {
        Args: { target_business_id: string; target_location_id: string };
        Returns: {
          address_line: string | null;
          business_id: string;
          country_code: string;
          created_at: string;
          created_by: string | null;
          display_name: string;
          id: string;
          locality: string | null;
          postal_code: string | null;
          status: Database["core"]["Enums"]["location_status"];
          timezone: string | null;
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "locations";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      archive_media_asset: {
        Args: { target_business_id: string; target_media_asset_id: string };
        Returns: {
          alt_text: string | null;
          business_id: string;
          byte_size: number;
          created_at: string;
          created_by: string | null;
          duration_ms: number | null;
          height: number | null;
          id: string;
          media_kind: Database["core"]["Enums"]["media_kind"];
          mime_type: string;
          original_filename: string;
          status: Database["core"]["Enums"]["media_status"];
          storage_bucket: string;
          storage_path: string;
          updated_at: string;
          width: number | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "media_assets";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      begin_business_domain_routing: {
        Args: { target_business_id: string; target_domain_id: string };
        Returns: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          hostname: string;
          id: string;
          is_primary: boolean;
          routing_checked_at: string | null;
          routing_live_at: string | null;
          routing_status: Database["core"]["Enums"]["domain_routing_status"];
          status: Database["core"]["Enums"]["domain_status"];
          target_module_key: string | null;
          updated_at: string;
          verification_checked_at: string | null;
          verification_method: Database["core"]["Enums"]["domain_verification_method"];
          verification_token: string;
          verified_at: string | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "business_domains";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      bootstrap_first_business: {
        Args: {
          requested_default_locale: string;
          requested_display_name: string;
          requested_slug: string;
        };
        Returns: {
          business_default_locale: Database["core"]["Enums"]["locale_code"];
          business_display_name: string;
          business_id: string;
          business_slug: string;
          was_created: boolean;
        }[];
      };
      complete_media_asset: {
        Args: { target_business_id: string; target_media_asset_id: string };
        Returns: {
          alt_text: string | null;
          business_id: string;
          byte_size: number;
          created_at: string;
          created_by: string | null;
          duration_ms: number | null;
          height: number | null;
          id: string;
          media_kind: Database["core"]["Enums"]["media_kind"];
          mime_type: string;
          original_filename: string;
          status: Database["core"]["Enums"]["media_status"];
          storage_bucket: string;
          storage_path: string;
          updated_at: string;
          width: number | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "media_assets";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      create_location: {
        Args: {
          requested_address_line: string;
          requested_country_code: string;
          requested_display_name: string;
          requested_locality: string;
          requested_postal_code: string;
          requested_timezone: string;
          target_business_id: string;
        };
        Returns: {
          address_line: string | null;
          business_id: string;
          country_code: string;
          created_at: string;
          created_by: string | null;
          display_name: string;
          id: string;
          locality: string | null;
          postal_code: string | null;
          status: Database["core"]["Enums"]["location_status"];
          timezone: string | null;
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "locations";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      current_user_business_access: {
        Args: { target_business_id: string };
        Returns: {
          can_manage_all_locations: boolean;
          can_manage_appearance: boolean;
          can_manage_business: boolean;
          can_manage_domains: boolean;
          can_manage_media: boolean;
          can_manage_modules: boolean;
          can_read_all_locations: boolean;
          can_view_audit: boolean;
          is_super_admin: boolean;
        }[];
      };
      current_user_has_permission: {
        Args: {
          target_business_id: string;
          target_location_id?: string;
          target_permission_key: string;
        };
        Returns: boolean;
      };
      current_user_is_super_admin: { Args: never; Returns: boolean };
      disable_business_domain: {
        Args: { target_business_id: string; target_domain_id: string };
        Returns: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          hostname: string;
          id: string;
          is_primary: boolean;
          routing_checked_at: string | null;
          routing_live_at: string | null;
          routing_status: Database["core"]["Enums"]["domain_routing_status"];
          status: Database["core"]["Enums"]["domain_status"];
          target_module_key: string | null;
          updated_at: string;
          verification_checked_at: string | null;
          verification_method: Database["core"]["Enums"]["domain_verification_method"];
          verification_token: string;
          verified_at: string | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "business_domains";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      disconnect_business_domain_routing: {
        Args: { target_business_id: string; target_domain_id: string };
        Returns: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          hostname: string;
          id: string;
          is_primary: boolean;
          routing_checked_at: string | null;
          routing_live_at: string | null;
          routing_status: Database["core"]["Enums"]["domain_routing_status"];
          status: Database["core"]["Enums"]["domain_status"];
          target_module_key: string | null;
          updated_at: string;
          verification_checked_at: string | null;
          verification_method: Database["core"]["Enums"]["domain_verification_method"];
          verification_token: string;
          verified_at: string | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "business_domains";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      record_business_domain_routing_attestation: {
        Args: {
          attested_status: Database["core"]["Enums"]["domain_routing_status"];
          requesting_user_id: string;
          target_domain_id: string;
        };
        Returns: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          hostname: string;
          id: string;
          is_primary: boolean;
          routing_checked_at: string | null;
          routing_live_at: string | null;
          routing_status: Database["core"]["Enums"]["domain_routing_status"];
          status: Database["core"]["Enums"]["domain_status"];
          target_module_key: string | null;
          updated_at: string;
          verification_checked_at: string | null;
          verification_method: Database["core"]["Enums"]["domain_verification_method"];
          verification_token: string;
          verified_at: string | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "business_domains";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      record_business_domain_verification: {
        Args: {
          requesting_user_id: string;
          target_domain_id: string;
          verification_succeeded: boolean;
        };
        Returns: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          hostname: string;
          id: string;
          is_primary: boolean;
          routing_checked_at: string | null;
          routing_live_at: string | null;
          routing_status: Database["core"]["Enums"]["domain_routing_status"];
          status: Database["core"]["Enums"]["domain_status"];
          target_module_key: string | null;
          updated_at: string;
          verification_checked_at: string | null;
          verification_method: Database["core"]["Enums"]["domain_verification_method"];
          verification_token: string;
          verified_at: string | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "business_domains";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      register_media_asset: {
        Args: {
          requested_alt_text?: string;
          requested_byte_size: number;
          requested_duration_ms?: number;
          requested_height?: number;
          requested_media_kind: string;
          requested_mime_type: string;
          requested_original_filename: string;
          requested_width?: number;
          target_business_id: string;
        };
        Returns: {
          alt_text: string | null;
          business_id: string;
          byte_size: number;
          created_at: string;
          created_by: string | null;
          duration_ms: number | null;
          height: number | null;
          id: string;
          media_kind: Database["core"]["Enums"]["media_kind"];
          mime_type: string;
          original_filename: string;
          status: Database["core"]["Enums"]["media_status"];
          storage_bucket: string;
          storage_path: string;
          updated_at: string;
          width: number | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "media_assets";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      reset_business_theme_overrides: {
        Args: { target_business_id: string; target_module_key: string };
        Returns: {
          changed: boolean;
          module_key: string;
          template_key: string;
        }[];
      };
      restart_business_domain_verification: {
        Args: { target_business_id: string; target_domain_id: string };
        Returns: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          hostname: string;
          id: string;
          is_primary: boolean;
          routing_checked_at: string | null;
          routing_live_at: string | null;
          routing_status: Database["core"]["Enums"]["domain_routing_status"];
          status: Database["core"]["Enums"]["domain_status"];
          target_module_key: string | null;
          updated_at: string;
          verification_checked_at: string | null;
          verification_method: Database["core"]["Enums"]["domain_verification_method"];
          verification_token: string;
          verified_at: string | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "business_domains";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      set_business_appearance: {
        Args: {
          requested_theme_overrides: Json;
          target_business_id: string;
          target_module_key: string;
          target_template_key: string;
        };
        Returns: {
          changed: boolean;
          module_key: string;
          template_changed: boolean;
          template_key: string;
          theme_changed: boolean;
        }[];
      };
      set_business_domain_primary: {
        Args: { target_business_id: string; target_domain_id: string };
        Returns: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          hostname: string;
          id: string;
          is_primary: boolean;
          routing_checked_at: string | null;
          routing_live_at: string | null;
          routing_status: Database["core"]["Enums"]["domain_routing_status"];
          status: Database["core"]["Enums"]["domain_status"];
          target_module_key: string | null;
          updated_at: string;
          verification_checked_at: string | null;
          verification_method: Database["core"]["Enums"]["domain_verification_method"];
          verification_token: string;
          verified_at: string | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "business_domains";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      set_business_domain_target: {
        Args: {
          requested_module_key: string;
          target_business_id: string;
          target_domain_id: string;
        };
        Returns: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          hostname: string;
          id: string;
          is_primary: boolean;
          routing_checked_at: string | null;
          routing_live_at: string | null;
          routing_status: Database["core"]["Enums"]["domain_routing_status"];
          status: Database["core"]["Enums"]["domain_status"];
          target_module_key: string | null;
          updated_at: string;
          verification_checked_at: string | null;
          verification_method: Database["core"]["Enums"]["domain_verification_method"];
          verification_token: string;
          verified_at: string | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "business_domains";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      set_business_module_enabled: {
        Args: {
          requested_enabled: boolean;
          target_business_id: string;
          target_module_key: string;
        };
        Returns: {
          changed: boolean;
          is_enabled: boolean;
          module_key: string;
        }[];
      };
      update_business_locales: {
        Args: {
          requested_default_locale: string;
          requested_enabled_locales: string[];
          target_business_id: string;
        };
        Returns: {
          changed: boolean;
          default_locale: Database["core"]["Enums"]["locale_code"];
          enabled_locales: Database["core"]["Enums"]["locale_code"][];
        }[];
      };
      update_business_settings: {
        Args: {
          requested_default_locale: string;
          requested_display_name: string;
          requested_slug: string;
          requested_status: string;
          requested_timezone: string;
          target_business_id: string;
        };
        Returns: {
          created_at: string;
          created_by: string | null;
          currency_code: string;
          default_locale: Database["core"]["Enums"]["locale_code"];
          display_name: string;
          id: string;
          slug: string;
          status: Database["core"]["Enums"]["business_status"];
          timezone: string;
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "businesses";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      update_location: {
        Args: {
          requested_address_line: string;
          requested_country_code: string;
          requested_display_name: string;
          requested_locality: string;
          requested_postal_code: string;
          requested_status: string;
          requested_timezone: string;
          target_business_id: string;
          target_location_id: string;
        };
        Returns: {
          address_line: string | null;
          business_id: string;
          country_code: string;
          created_at: string;
          created_by: string | null;
          display_name: string;
          id: string;
          locality: string | null;
          postal_code: string | null;
          status: Database["core"]["Enums"]["location_status"];
          timezone: string | null;
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "locations";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      update_media_asset_alt_text: {
        Args: {
          requested_alt_text: string;
          target_business_id: string;
          target_media_asset_id: string;
        };
        Returns: {
          alt_text: string | null;
          business_id: string;
          byte_size: number;
          created_at: string;
          created_by: string | null;
          duration_ms: number | null;
          height: number | null;
          id: string;
          media_kind: Database["core"]["Enums"]["media_kind"];
          mime_type: string;
          original_filename: string;
          status: Database["core"]["Enums"]["media_status"];
          storage_bucket: string;
          storage_path: string;
          updated_at: string;
          width: number | null;
        }[];
        SetofOptions: {
          from: "*";
          to: "media_assets";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
    };
    Enums: {
      audit_actor_kind: "user" | "system" | "service";
      business_status: "active" | "suspended" | "archived";
      domain_routing_status: "unconfigured" | "provisioning" | "live" | "failed" | "disconnected";
      domain_status: "pending" | "verified" | "failed" | "disabled";
      domain_verification_method: "dns_txt";
      locale_code: "ar" | "he" | "en";
      location_status: "active" | "inactive" | "archived";
      media_kind: "image" | "video";
      media_status: "pending" | "active" | "archived";
      membership_status: "active" | "suspended";
      permission_scope: "business" | "business_or_location";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_restaurant_publication: {
        Args: { requested_business_slug: string };
        Returns: Json;
      };
      list_public_restaurant_sitemap: {
        Args: never;
        Returns: {
          business_slug: string;
          default_locale: Database["core"]["Enums"]["locale_code"];
          locales: Database["core"]["Enums"]["locale_code"][];
          primary_hostname: string;
        }[];
      };
      resolve_public_domain: {
        Args: { requested_hostname: string };
        Returns: Json;
      };
      resolve_public_restaurant_primary_domain: {
        Args: { requested_business_slug: string };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  restaurant: {
    Tables: {
      categories: {
        Row: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          display_order: number;
          id: string;
          image_media_asset_id: string | null;
          internal_name: string;
          is_visible: boolean;
          lifecycle_status: Database["restaurant"]["Enums"]["lifecycle_status"];
          menu_id: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          image_media_asset_id?: string | null;
          internal_name: string;
          is_visible?: boolean;
          lifecycle_status?: Database["restaurant"]["Enums"]["lifecycle_status"];
          menu_id: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          image_media_asset_id?: string | null;
          internal_name?: string;
          is_visible?: boolean;
          lifecycle_status?: Database["restaurant"]["Enums"]["lifecycle_status"];
          menu_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_menu_fk";
            columns: ["business_id", "menu_id"];
            isOneToOne: false;
            referencedRelation: "menus";
            referencedColumns: ["business_id", "id"];
          },
        ];
      };
      category_translations: {
        Row: {
          business_id: string;
          category_id: string;
          created_at: string;
          description: string | null;
          locale_code: Database["core"]["Enums"]["locale_code"];
          name: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          category_id: string;
          created_at?: string;
          description?: string | null;
          locale_code: Database["core"]["Enums"]["locale_code"];
          name: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          category_id?: string;
          created_at?: string;
          description?: string | null;
          locale_code?: Database["core"]["Enums"]["locale_code"];
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "category_translations_category_fk";
            columns: ["business_id", "category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["business_id", "id"];
          },
        ];
      };
      configurations: {
        Row: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          is_publicly_active: boolean;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          is_publicly_active?: boolean;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          is_publicly_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      item_location_availability: {
        Row: {
          availability_status: Database["restaurant"]["Enums"]["availability_status"];
          business_id: string;
          created_at: string;
          item_id: string;
          location_id: string;
          updated_at: string;
        };
        Insert: {
          availability_status: Database["restaurant"]["Enums"]["availability_status"];
          business_id: string;
          created_at?: string;
          item_id: string;
          location_id: string;
          updated_at?: string;
        };
        Update: {
          availability_status?: Database["restaurant"]["Enums"]["availability_status"];
          business_id?: string;
          created_at?: string;
          item_id?: string;
          location_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_location_availability_item_fk";
            columns: ["business_id", "item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["business_id", "id"];
          },
        ];
      };
      item_modifier_groups: {
        Row: {
          business_id: string;
          created_at: string;
          display_order: number;
          item_id: string;
          maximum_selections: number;
          minimum_selections: number;
          modifier_group_id: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          display_order?: number;
          item_id: string;
          maximum_selections?: number;
          minimum_selections?: number;
          modifier_group_id: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          display_order?: number;
          item_id?: string;
          maximum_selections?: number;
          minimum_selections?: number;
          modifier_group_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_modifier_groups_group_fk";
            columns: ["business_id", "modifier_group_id"];
            isOneToOne: false;
            referencedRelation: "modifier_groups";
            referencedColumns: ["business_id", "id"];
          },
          {
            foreignKeyName: "item_modifier_groups_item_fk";
            columns: ["business_id", "item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["business_id", "id"];
          },
        ];
      };
      item_translations: {
        Row: {
          business_id: string;
          created_at: string;
          description: string | null;
          item_id: string;
          locale_code: Database["core"]["Enums"]["locale_code"];
          name: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          description?: string | null;
          item_id: string;
          locale_code: Database["core"]["Enums"]["locale_code"];
          name: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          description?: string | null;
          item_id?: string;
          locale_code?: Database["core"]["Enums"]["locale_code"];
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_translations_item_fk";
            columns: ["business_id", "item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["business_id", "id"];
          },
        ];
      };
      item_variant_translations: {
        Row: {
          business_id: string;
          created_at: string;
          item_variant_id: string;
          locale_code: Database["core"]["Enums"]["locale_code"];
          name: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          item_variant_id: string;
          locale_code: Database["core"]["Enums"]["locale_code"];
          name: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          item_variant_id?: string;
          locale_code?: Database["core"]["Enums"]["locale_code"];
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_variant_translations_variant_fk";
            columns: ["business_id", "item_variant_id"];
            isOneToOne: false;
            referencedRelation: "item_variants";
            referencedColumns: ["business_id", "id"];
          },
        ];
      };
      item_variants: {
        Row: {
          availability_status: Database["restaurant"]["Enums"]["availability_status"];
          business_id: string;
          created_at: string;
          created_by: string | null;
          display_order: number;
          id: string;
          internal_name: string;
          is_visible: boolean;
          item_id: string;
          lifecycle_status: Database["restaurant"]["Enums"]["lifecycle_status"];
          price_minor: number;
          updated_at: string;
        };
        Insert: {
          availability_status?: Database["restaurant"]["Enums"]["availability_status"];
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          internal_name: string;
          is_visible?: boolean;
          item_id: string;
          lifecycle_status?: Database["restaurant"]["Enums"]["lifecycle_status"];
          price_minor: number;
          updated_at?: string;
        };
        Update: {
          availability_status?: Database["restaurant"]["Enums"]["availability_status"];
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          internal_name?: string;
          is_visible?: boolean;
          item_id?: string;
          lifecycle_status?: Database["restaurant"]["Enums"]["lifecycle_status"];
          price_minor?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_variants_item_fk";
            columns: ["business_id", "item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["business_id", "id"];
          },
        ];
      };
      items: {
        Row: {
          availability_status: Database["restaurant"]["Enums"]["availability_status"];
          base_price_minor: number;
          business_id: string;
          category_id: string;
          created_at: string;
          created_by: string | null;
          display_order: number;
          id: string;
          image_media_asset_id: string | null;
          internal_name: string;
          is_visible: boolean;
          lifecycle_status: Database["restaurant"]["Enums"]["lifecycle_status"];
          menu_id: string;
          updated_at: string;
        };
        Insert: {
          availability_status?: Database["restaurant"]["Enums"]["availability_status"];
          base_price_minor: number;
          business_id: string;
          category_id: string;
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          image_media_asset_id?: string | null;
          internal_name: string;
          is_visible?: boolean;
          lifecycle_status?: Database["restaurant"]["Enums"]["lifecycle_status"];
          menu_id: string;
          updated_at?: string;
        };
        Update: {
          availability_status?: Database["restaurant"]["Enums"]["availability_status"];
          base_price_minor?: number;
          business_id?: string;
          category_id?: string;
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          image_media_asset_id?: string | null;
          internal_name?: string;
          is_visible?: boolean;
          lifecycle_status?: Database["restaurant"]["Enums"]["lifecycle_status"];
          menu_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "items_category_fk";
            columns: ["business_id", "menu_id", "category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["business_id", "menu_id", "id"];
          },
        ];
      };
      menu_translations: {
        Row: {
          business_id: string;
          created_at: string;
          description: string | null;
          locale_code: Database["core"]["Enums"]["locale_code"];
          menu_id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          description?: string | null;
          locale_code: Database["core"]["Enums"]["locale_code"];
          menu_id: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          description?: string | null;
          locale_code?: Database["core"]["Enums"]["locale_code"];
          menu_id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_translations_menu_fk";
            columns: ["business_id", "menu_id"];
            isOneToOne: false;
            referencedRelation: "menus";
            referencedColumns: ["business_id", "id"];
          },
        ];
      };
      menus: {
        Row: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          display_order: number;
          id: string;
          internal_name: string;
          lifecycle_status: Database["restaurant"]["Enums"]["lifecycle_status"];
          publication_status: Database["restaurant"]["Enums"]["publication_status"];
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          internal_name: string;
          lifecycle_status?: Database["restaurant"]["Enums"]["lifecycle_status"];
          publication_status?: Database["restaurant"]["Enums"]["publication_status"];
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          internal_name?: string;
          lifecycle_status?: Database["restaurant"]["Enums"]["lifecycle_status"];
          publication_status?: Database["restaurant"]["Enums"]["publication_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      modifier_group_translations: {
        Row: {
          business_id: string;
          created_at: string;
          description: string | null;
          locale_code: Database["core"]["Enums"]["locale_code"];
          modifier_group_id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          description?: string | null;
          locale_code: Database["core"]["Enums"]["locale_code"];
          modifier_group_id: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          description?: string | null;
          locale_code?: Database["core"]["Enums"]["locale_code"];
          modifier_group_id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "modifier_group_translations_group_fk";
            columns: ["business_id", "modifier_group_id"];
            isOneToOne: false;
            referencedRelation: "modifier_groups";
            referencedColumns: ["business_id", "id"];
          },
        ];
      };
      modifier_groups: {
        Row: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
          internal_name: string;
          is_visible: boolean;
          lifecycle_status: Database["restaurant"]["Enums"]["lifecycle_status"];
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          internal_name: string;
          is_visible?: boolean;
          lifecycle_status?: Database["restaurant"]["Enums"]["lifecycle_status"];
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          internal_name?: string;
          is_visible?: boolean;
          lifecycle_status?: Database["restaurant"]["Enums"]["lifecycle_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      modifier_translations: {
        Row: {
          business_id: string;
          created_at: string;
          locale_code: Database["core"]["Enums"]["locale_code"];
          modifier_id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          locale_code: Database["core"]["Enums"]["locale_code"];
          modifier_id: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          locale_code?: Database["core"]["Enums"]["locale_code"];
          modifier_id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "modifier_translations_modifier_fk";
            columns: ["business_id", "modifier_id"];
            isOneToOne: false;
            referencedRelation: "modifiers";
            referencedColumns: ["business_id", "id"];
          },
        ];
      };
      modifiers: {
        Row: {
          availability_status: Database["restaurant"]["Enums"]["availability_status"];
          business_id: string;
          created_at: string;
          created_by: string | null;
          display_order: number;
          id: string;
          internal_name: string;
          is_visible: boolean;
          lifecycle_status: Database["restaurant"]["Enums"]["lifecycle_status"];
          modifier_group_id: string;
          price_delta_minor: number;
          updated_at: string;
        };
        Insert: {
          availability_status?: Database["restaurant"]["Enums"]["availability_status"];
          business_id: string;
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          internal_name: string;
          is_visible?: boolean;
          lifecycle_status?: Database["restaurant"]["Enums"]["lifecycle_status"];
          modifier_group_id: string;
          price_delta_minor?: number;
          updated_at?: string;
        };
        Update: {
          availability_status?: Database["restaurant"]["Enums"]["availability_status"];
          business_id?: string;
          created_at?: string;
          created_by?: string | null;
          display_order?: number;
          id?: string;
          internal_name?: string;
          is_visible?: boolean;
          lifecycle_status?: Database["restaurant"]["Enums"]["lifecycle_status"];
          modifier_group_id?: string;
          price_delta_minor?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "modifiers_group_fk";
            columns: ["business_id", "modifier_group_id"];
            isOneToOne: false;
            referencedRelation: "modifier_groups";
            referencedColumns: ["business_id", "id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      remove_item_modifier_group: {
        Args: {
          target_business_id: string;
          target_item_id: string;
          target_modifier_group_id: string;
        };
        Returns: {
          changed: boolean;
          item_id: string;
          modifier_group_id: string;
        }[];
      };
      save_category: {
        Args: {
          requested_display_order: number;
          requested_image_media_asset_id: string;
          requested_internal_name: string;
          requested_lifecycle_status: string;
          requested_visible: boolean;
          target_business_id: string;
          target_category_id: string;
          target_menu_id: string;
        };
        Returns: {
          category_id: string;
          changed: boolean;
          created: boolean;
        }[];
      };
      save_configuration: {
        Args: { requested_publicly_active: boolean; target_business_id: string };
        Returns: {
          business_id: string;
          changed: boolean;
          is_publicly_active: boolean;
        }[];
      };
      save_item: {
        Args: {
          requested_availability_status: string;
          requested_base_price_minor: number;
          requested_display_order: number;
          requested_image_media_asset_id: string;
          requested_internal_name: string;
          requested_lifecycle_status: string;
          requested_visible: boolean;
          target_business_id: string;
          target_category_id: string;
          target_item_id: string;
          target_menu_id: string;
        };
        Returns: {
          changed: boolean;
          created: boolean;
          item_id: string;
        }[];
      };
      save_item_variant: {
        Args: {
          requested_availability_status: string;
          requested_display_order: number;
          requested_internal_name: string;
          requested_lifecycle_status: string;
          requested_price_minor: number;
          requested_visible: boolean;
          target_business_id: string;
          target_item_id: string;
          target_variant_id: string;
        };
        Returns: {
          changed: boolean;
          created: boolean;
          variant_id: string;
        }[];
      };
      save_menu: {
        Args: {
          requested_display_order: number;
          requested_internal_name: string;
          requested_lifecycle_status: string;
          requested_publication_status: string;
          target_business_id: string;
          target_menu_id: string;
        };
        Returns: {
          changed: boolean;
          created: boolean;
          menu_id: string;
        }[];
      };
      save_modifier: {
        Args: {
          requested_availability_status: string;
          requested_display_order: number;
          requested_internal_name: string;
          requested_lifecycle_status: string;
          requested_price_delta_minor: number;
          requested_visible: boolean;
          target_business_id: string;
          target_modifier_group_id: string;
          target_modifier_id: string;
        };
        Returns: {
          changed: boolean;
          created: boolean;
          modifier_id: string;
        }[];
      };
      save_modifier_group: {
        Args: {
          requested_internal_name: string;
          requested_lifecycle_status: string;
          requested_visible: boolean;
          target_business_id: string;
          target_modifier_group_id: string;
        };
        Returns: {
          changed: boolean;
          created: boolean;
          modifier_group_id: string;
        }[];
      };
      save_translation: {
        Args: {
          requested_description?: string;
          requested_entity_type: string;
          requested_locale_code: string;
          requested_name: string;
          target_business_id: string;
          target_entity_id: string;
        };
        Returns: {
          changed: boolean;
          entity_id: string;
          entity_type: Database["restaurant"]["Enums"]["translatable_entity_type"];
          locale_code: Database["core"]["Enums"]["locale_code"];
        }[];
      };
      set_item_location_availability: {
        Args: {
          requested_availability_status: string;
          target_business_id: string;
          target_item_id: string;
          target_location_id: string;
        };
        Returns: {
          availability_status: Database["restaurant"]["Enums"]["availability_status"];
          changed: boolean;
          item_id: string;
          location_id: string;
        }[];
      };
      set_item_modifier_group: {
        Args: {
          requested_display_order: number;
          requested_maximum_selections: number;
          requested_minimum_selections: number;
          target_business_id: string;
          target_item_id: string;
          target_modifier_group_id: string;
        };
        Returns: {
          changed: boolean;
          item_id: string;
          modifier_group_id: string;
        }[];
      };
    };
    Enums: {
      availability_status: "available" | "sold_out";
      lifecycle_status: "active" | "archived";
      publication_status: "draft" | "published";
      translatable_entity_type:
        "menu" | "category" | "item" | "item_variant" | "modifier_group" | "modifier";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  core: {
    Enums: {
      audit_actor_kind: ["user", "system", "service"],
      business_status: ["active", "suspended", "archived"],
      domain_routing_status: ["unconfigured", "provisioning", "live", "failed", "disconnected"],
      domain_status: ["pending", "verified", "failed", "disabled"],
      domain_verification_method: ["dns_txt"],
      locale_code: ["ar", "he", "en"],
      location_status: ["active", "inactive", "archived"],
      media_kind: ["image", "video"],
      media_status: ["pending", "active", "archived"],
      membership_status: ["active", "suspended"],
      permission_scope: ["business", "business_or_location"],
    },
  },
  public: {
    Enums: {},
  },
  restaurant: {
    Enums: {
      availability_status: ["available", "sold_out"],
      lifecycle_status: ["active", "archived"],
      publication_status: ["draft", "published"],
      translatable_entity_type: [
        "menu",
        "category",
        "item",
        "item_variant",
        "modifier_group",
        "modifier",
      ],
    },
  },
} as const;
