import "server-only";

import { createDarbPrivilegedSupabaseClient } from "@darb/database/privileged";

import { getSupabasePublicConfig } from "./config";

export function createDomainAttestationSupabaseClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is required for trusted domain attestation.");
  }

  const { url } = getSupabasePublicConfig();
  return createDarbPrivilegedSupabaseClient({ secretKey, url });
}

export const createDomainRoutingAttestationSupabaseClient = createDomainAttestationSupabaseClient;
