import "server-only";

import { cache } from "react";

import type { DarbServerSupabaseClient } from "@darb/database/server";
import type { Database } from "@darb/database/types";

import { createServerComponentSupabaseClient } from "./supabase/server";

type BusinessRow = Database["core"]["Tables"]["businesses"]["Row"];
type MembershipRow = Database["core"]["Tables"]["memberships"]["Row"];

export interface CurrentUser {
  email: string | null;
  id: string;
}

export type AccessibleBusiness = Pick<
  BusinessRow,
  "created_at" | "default_locale" | "display_name" | "id" | "slug" | "status"
>;

export type ActiveMembership = Pick<
  MembershipRow,
  "business_id" | "id" | "joined_at" | "status" | "user_id"
>;

export interface AdminAccessSnapshot {
  businesses: AccessibleBusiness[];
  user: CurrentUser | null;
}

const accessibleBusinessColumns =
  "id, slug, display_name, status, default_locale, created_at" as const;

export const getAdminAccessSnapshot = cache(async (): Promise<AdminAccessSnapshot> => {
  const supabase = await createServerComponentSupabaseClient();
  const user = await resolveCurrentUser(supabase);

  if (!user) {
    return { businesses: [], user: null };
  }

  return {
    businesses: await listAccessibleBusinesses(supabase),
    user,
  };
});

export async function resolveCurrentUser(
  supabase: DarbServerSupabaseClient,
): Promise<CurrentUser | null> {
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims.sub) {
    return null;
  }

  return {
    email: typeof data.claims.email === "string" ? data.claims.email : null,
    id: data.claims.sub,
  };
}

export async function listAccessibleBusinesses(
  supabase: DarbServerSupabaseClient,
): Promise<AccessibleBusiness[]> {
  const { data, error } = await supabase
    .schema("core")
    .from("businesses")
    .select(accessibleBusinessColumns)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Unable to resolve business access (${error.code}).`);
  }

  return data;
}

export async function listActiveMemberships(
  supabase: DarbServerSupabaseClient,
  userId: string,
): Promise<ActiveMembership[]> {
  const { data, error } = await supabase
    .schema("core")
    .from("memberships")
    .select("id, business_id, user_id, status, joined_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("joined_at", { ascending: true });

  if (error) {
    throw new Error(`Unable to resolve active memberships (${error.code}).`);
  }

  return data;
}

export async function resolveBusinessContext(
  supabase: DarbServerSupabaseClient,
  businessReference: string,
): Promise<AccessibleBusiness | null> {
  const businesses = await listAccessibleBusinesses(supabase);
  return (
    businesses.find(
      (business) => business.id === businessReference || business.slug === businessReference,
    ) ?? null
  );
}

export async function hasBusinessPermission(
  supabase: DarbServerSupabaseClient,
  businessId: string,
  permissionKey: string,
  locationId?: string,
): Promise<boolean> {
  const { data, error } = await supabase.schema("core").rpc("current_user_has_permission", {
    target_business_id: businessId,
    target_permission_key: permissionKey,
    ...(locationId ? { target_location_id: locationId } : {}),
  });

  return !error && data === true;
}

export async function isCurrentUserSuperAdmin(
  supabase: DarbServerSupabaseClient,
): Promise<boolean> {
  const { data, error } = await supabase.schema("core").rpc("current_user_is_super_admin");
  return !error && data === true;
}
