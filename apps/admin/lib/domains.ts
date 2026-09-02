import "server-only";

import type { DarbServerSupabaseClient } from "@darb/database/server";
import type { Database } from "@darb/database/types";

type DomainRow = Database["core"]["Tables"]["business_domains"]["Row"];

export type AccessibleBusinessDomain = Pick<
  DomainRow,
  | "created_at"
  | "hostname"
  | "id"
  | "is_primary"
  | "routing_checked_at"
  | "routing_live_at"
  | "routing_status"
  | "status"
  | "target_module_key"
  | "updated_at"
  | "verification_checked_at"
  | "verification_method"
  | "verification_token"
  | "verified_at"
>;

const domainColumns =
  "id, hostname, status, verification_token, verification_method, verification_checked_at, verified_at, target_module_key, routing_status, routing_checked_at, routing_live_at, is_primary, created_at, updated_at" as const;

export async function listBusinessDomains(
  supabase: DarbServerSupabaseClient,
  businessId: string,
): Promise<AccessibleBusinessDomain[]> {
  const { data, error } = await supabase
    .schema("core")
    .from("business_domains")
    .select(domainColumns)
    .eq("business_id", businessId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Unable to load business domains (${error.code}).`);
  }

  return data;
}

export async function resolveBusinessDomain(
  supabase: DarbServerSupabaseClient,
  businessId: string,
  domainId: string,
): Promise<AccessibleBusinessDomain | null> {
  const { data, error } = await supabase
    .schema("core")
    .from("business_domains")
    .select(domainColumns)
    .eq("business_id", businessId)
    .eq("id", domainId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to resolve business domain (${error.code}).`);
  }

  return data;
}

export function findPrimaryDomain(domains: readonly AccessibleBusinessDomain[]) {
  return (
    domains.find(
      (domain) =>
        domain.is_primary && domain.status === "verified" && domain.routing_status === "live",
    ) ?? null
  );
}

export function resolveVerifiedHostname(
  domains: readonly AccessibleBusinessDomain[],
  hostname: string,
) {
  return (
    domains.find((domain) => domain.hostname === hostname && domain.status === "verified") ?? null
  );
}
