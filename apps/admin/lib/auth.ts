import "server-only";

import { cache } from "react";

import type { DarbServerSupabaseClient } from "@darb/database/server";
import type { Database } from "@darb/database/types";

import { createServerComponentSupabaseClient } from "./supabase/server";
import { listBusinessModuleStates } from "./modules";
import type { BusinessModuleState } from "./module-state";

type BusinessRow = Database["core"]["Tables"]["businesses"]["Row"];
type LocationRow = Database["core"]["Tables"]["locations"]["Row"];
type MembershipRow = Database["core"]["Tables"]["memberships"]["Row"];

export interface CurrentUser {
  email: string | null;
  id: string;
}

export type AccessibleBusiness = Pick<
  BusinessRow,
  | "created_at"
  | "currency_code"
  | "default_locale"
  | "display_name"
  | "id"
  | "slug"
  | "status"
  | "timezone"
  | "updated_at"
>;

export type AccessibleLocation = Pick<
  LocationRow,
  | "address_line"
  | "business_id"
  | "country_code"
  | "created_at"
  | "display_name"
  | "id"
  | "locality"
  | "postal_code"
  | "status"
  | "timezone"
  | "updated_at"
>;

export type ActiveMembership = Pick<
  MembershipRow,
  "business_id" | "id" | "joined_at" | "status" | "user_id"
>;

export interface AdminAccessSnapshot {
  businesses: AccessibleBusiness[];
  user: CurrentUser | null;
}

export interface BusinessAccessSnapshot {
  canManageAllLocations: boolean;
  canManageBusiness: boolean;
  canManageModules: boolean;
  canReadAllLocations: boolean;
  canViewAudit: boolean;
  isSuperAdmin: boolean;
}

export interface BusinessAdminContext extends AdminAccessSnapshot {
  access: BusinessAccessSnapshot;
  business: AccessibleBusiness;
  locations: AccessibleLocation[];
  modules: BusinessModuleState[];
  user: CurrentUser;
}

const accessibleBusinessColumns =
  "id, slug, display_name, status, default_locale, currency_code, timezone, created_at, updated_at" as const;
const accessibleLocationColumns =
  "id, business_id, display_name, status, address_line, locality, postal_code, country_code, timezone, created_at, updated_at" as const;

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

export const getBusinessAdminContext = cache(
  async (businessReference: string): Promise<BusinessAdminContext | null> => {
    const snapshot = await getAdminAccessSnapshot();

    if (!snapshot.user) {
      return null;
    }

    const business =
      snapshot.businesses.find(
        (candidate) => candidate.id === businessReference || candidate.slug === businessReference,
      ) ?? null;

    if (!business) {
      return null;
    }

    const supabase = await createServerComponentSupabaseClient();
    const [access, locations, modules] = await Promise.all([
      getBusinessAccessSnapshot(supabase, business.id),
      listAccessibleLocations(supabase, business.id),
      listBusinessModuleStates(supabase, business.id, business.status),
    ]);

    return { ...snapshot, access, business, locations, modules, user: snapshot.user };
  },
);

export async function getBusinessAccessSnapshot(
  supabase: DarbServerSupabaseClient,
  businessId: string,
): Promise<BusinessAccessSnapshot> {
  const { data, error } = await supabase
    .schema("core")
    .rpc("current_user_business_access", { target_business_id: businessId })
    .single();

  if (error || !data) {
    throw new Error(`Unable to resolve business permissions (${error?.code ?? "NO_DATA"}).`);
  }

  return {
    canManageAllLocations: data.can_manage_all_locations,
    canManageBusiness: data.can_manage_business,
    canManageModules: data.can_manage_modules,
    canReadAllLocations: data.can_read_all_locations,
    canViewAudit: data.can_view_audit,
    isSuperAdmin: data.is_super_admin,
  };
}

export async function listAccessibleLocations(
  supabase: DarbServerSupabaseClient,
  businessId: string,
): Promise<AccessibleLocation[]> {
  const { data, error } = await supabase
    .schema("core")
    .from("locations")
    .select(accessibleLocationColumns)
    .eq("business_id", businessId)
    .order("status", { ascending: true })
    .order("display_name", { ascending: true });

  if (error) {
    throw new Error(`Unable to resolve location access (${error.code}).`);
  }

  return data;
}

export async function resolveAccessibleLocation(
  supabase: DarbServerSupabaseClient,
  businessId: string,
  locationId: string,
): Promise<AccessibleLocation | null> {
  const { data, error } = await supabase
    .schema("core")
    .from("locations")
    .select(accessibleLocationColumns)
    .eq("business_id", businessId)
    .eq("id", locationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to resolve location context (${error.code}).`);
  }

  return data;
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
