import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { normalizePublicSupabaseConfig, type PublicSupabaseConfig } from "./public-config";

export type DarbAnonymousSupabaseClient = SupabaseClient<Database>;

export function createDarbAnonymousSupabaseClient(
  config: PublicSupabaseConfig,
): DarbAnonymousSupabaseClient {
  const { publishableKey, url } = normalizePublicSupabaseConfig(config);

  return createClient<Database>(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export type { PublicSupabaseConfig };
