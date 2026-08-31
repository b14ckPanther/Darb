import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { normalizePublicSupabaseConfig, type PublicSupabaseConfig } from "./public-config";

export type DarbBrowserSupabaseClient = SupabaseClient<Database>;

export function createDarbBrowserSupabaseClient(
  config: PublicSupabaseConfig,
): DarbBrowserSupabaseClient {
  const { publishableKey, url } = normalizePublicSupabaseConfig(config);

  return createBrowserClient<Database>(url, publishableKey);
}

export type { PublicSupabaseConfig };
