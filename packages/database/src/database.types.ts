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
          status: Database["core"]["Enums"]["domain_status"];
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
          status?: Database["core"]["Enums"]["domain_status"];
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
          status?: Database["core"]["Enums"]["domain_status"];
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
          status: Database["core"]["Enums"]["domain_status"];
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
          status: Database["core"]["Enums"]["domain_status"];
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
          status: Database["core"]["Enums"]["domain_status"];
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
      restart_business_domain_verification: {
        Args: { target_business_id: string; target_domain_id: string };
        Returns: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          hostname: string;
          id: string;
          is_primary: boolean;
          status: Database["core"]["Enums"]["domain_status"];
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
      set_business_domain_primary: {
        Args: { target_business_id: string; target_domain_id: string };
        Returns: {
          business_id: string;
          created_at: string;
          created_by: string | null;
          hostname: string;
          id: string;
          is_primary: boolean;
          status: Database["core"]["Enums"]["domain_status"];
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
} as const;
