import "server-only";

import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { normalizePublicSupabaseConfig, type PublicSupabaseConfig } from "./public-config";

export interface ServerSupabaseConfig extends PublicSupabaseConfig {
  cookies: CookieMethodsServer;
}

export type DarbServerSupabaseClient = SupabaseClient<Database>;

export function createDarbServerSupabaseClient({
  cookies,
  ...config
}: ServerSupabaseConfig): DarbServerSupabaseClient {
  const { publishableKey, url } = normalizePublicSupabaseConfig(config);

  return createServerClient<Database>(url, publishableKey, { cookies });
}
