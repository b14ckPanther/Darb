import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";

import type { BusinessAdminContext } from "./auth";
import { hasBusinessPermission } from "./auth";
import { requireBusinessAdminContext } from "./admin-context";
import { createServerComponentSupabaseClient } from "./supabase/server";
import { businessPath } from "./navigation";

export interface RestaurantAccessSnapshot {
  canManage: boolean;
  canRead: boolean;
}

export interface RestaurantAdminContext {
  access: RestaurantAccessSnapshot;
  businessContext: BusinessAdminContext;
  capabilityAvailable: boolean;
  capabilityEnabled: boolean;
  capabilityEntitled: boolean;
  capabilityEffective: boolean;
  restrictionReason: string | null;
}

export const getRestaurantAccessSnapshot = cache(
  async (businessId: string): Promise<RestaurantAccessSnapshot> => {
    const supabase = await createServerComponentSupabaseClient();
    const [readPermission, managePermission] = await Promise.all([
      hasBusinessPermission(supabase, businessId, "restaurant.read"),
      hasBusinessPermission(supabase, businessId, "restaurant.manage"),
    ]);

    return {
      canManage: managePermission,
      canRead: readPermission || managePermission,
    };
  },
);

export async function requireRestaurantAdminContext(
  businessSlug: string,
): Promise<RestaurantAdminContext> {
  const businessContext = await requireBusinessAdminContext(businessSlug);
  const capability = businessContext.modules.find((module) => module.key === "restaurant");

  if (!capability?.isEnabled) {
    redirect(businessPath(businessContext.business.slug));
  }

  const access = await getRestaurantAccessSnapshot(businessContext.business.id);

  if (!access.canRead) {
    notFound();
  }

  return {
    access,
    businessContext,
    capabilityAvailable: capability.isAvailable,
    capabilityEnabled: capability.isEnabled,
    capabilityEntitled: capability.isEntitled,
    capabilityEffective: capability.isEffectivelyEnabled,
    restrictionReason: capability.unavailableReason,
  };
}

export function canMutateRestaurant(context: RestaurantAdminContext): boolean {
  return (
    context.access.canManage &&
    context.capabilityEffective &&
    context.businessContext.business.status === "active"
  );
}
