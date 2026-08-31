import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

export interface PrivilegedSupabaseConfig {
  secretKey: string;
  url: string;
}

export type DarbPrivilegedSupabaseClient = SupabaseClient<Database>;

export function createDarbPrivilegedSupabaseClient({
  secretKey: rawSecretKey,
  url: rawUrl,
}: PrivilegedSupabaseConfig): DarbPrivilegedSupabaseClient {
  const secretKey = rawSecretKey.trim();
  const url = rawUrl.trim();

  if (!url) {
    throw new Error("Supabase URL is required.");
  }

  const parsedUrl = new URL(url);

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Supabase URL must use HTTP or HTTPS.");
  }

  if (!secretKey) {
    throw new Error("Supabase secret key is required.");
  }

  if (secretKey.startsWith("sb_publishable_")) {
    throw new Error("A Supabase publishable key cannot be used for privileged access.");
  }

  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
