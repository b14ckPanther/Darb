import "server-only";

import { createDarbPrivilegedSupabaseClient } from "@darb/database/privileged";

import { readSupabaseSecretKey } from "../environment";
import { getSupabasePublicConfig } from "./config";

export function createDomainAttestationSupabaseClient() {
  const secretKey = readSupabaseSecretKey();
  const { url } = getSupabasePublicConfig();
  return createDarbPrivilegedSupabaseClient({ secretKey, url });
}

export const createDomainRoutingAttestationSupabaseClient = createDomainAttestationSupabaseClient;
