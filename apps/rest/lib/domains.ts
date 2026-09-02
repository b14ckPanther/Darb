import "server-only";

import { cache } from "react";
import { createDarbAnonymousSupabaseClient } from "@darb/database/anonymous";
import { getPublicSupabaseConfig } from "./config";

export interface PublicDomainResolution {
  businessSlug: string;
  hostname: string;
  isPrimary: boolean;
  primaryHostname: string | null;
  targetModuleKey: "restaurant";
}

export const resolvePublicDomain = cache(
  async (hostname: string): Promise<PublicDomainResolution | null> => {
    const client = createDarbAnonymousSupabaseClient(getPublicSupabaseConfig());
    const { data, error } = await client.rpc("resolve_public_domain", {
      requested_hostname: hostname,
    });
    if (error) {
      console.error("Public custom-domain resolution failed", { hostname });
      throw new Error("The public hostname could not be resolved.");
    }
    return parsePublicDomainResolution(data);
  },
);

export const resolvePrimaryRestaurantHostname = cache(
  async (businessSlug: string): Promise<string | null> => {
    const client = createDarbAnonymousSupabaseClient(getPublicSupabaseConfig());
    const { data, error } = await client.rpc("resolve_public_restaurant_primary_domain", {
      requested_business_slug: businessSlug,
    });
    if (error) {
      console.error("Public Restaurant primary-domain resolution failed", { businessSlug });
      throw new Error("The canonical Restaurant hostname could not be resolved.");
    }
    return typeof data === "string" ? data : null;
  },
);

export function parsePublicDomainResolution(value: unknown): PublicDomainResolution | null {
  if (value === null) return null;
  if (!isRecord(value)) return null;
  if (
    typeof value.hostname !== "string" ||
    typeof value.businessSlug !== "string" ||
    value.targetModuleKey !== "restaurant" ||
    typeof value.isPrimary !== "boolean" ||
    !(typeof value.primaryHostname === "string" || value.primaryHostname === null)
  )
    return null;
  return value as unknown as PublicDomainResolution;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
