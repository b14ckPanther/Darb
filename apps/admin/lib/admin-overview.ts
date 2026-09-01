import "server-only";

import type { DarbServerSupabaseClient } from "@darb/database/server";

import { deriveAdminReadiness, type AdminReadinessItem } from "./admin-foundation";
import { listResolvedBusinessAppearances } from "./appearance";
import type { BusinessAdminContext } from "./auth";
import { listBusinessLocales, mapBusinessLocaleState } from "./business-locales";
import { findPrimaryDomain, listBusinessDomains } from "./domains";
import { businessPath } from "./navigation";

export interface AdminOverviewSnapshot {
  activeMediaCount: number;
  appearanceContextCount: number;
  configuredAppearanceCount: number;
  domainCount: number;
  enabledLocaleCount: number;
  enabledModuleCount: number;
  primaryDomain: string | null;
  readiness: AdminReadinessItem[];
  verifiedDomainCount: number;
}

export async function loadAdminOverview(
  supabase: DarbServerSupabaseClient,
  context: BusinessAdminContext,
): Promise<AdminOverviewSnapshot> {
  const [localeRows, activeMediaCount, domains, appearances] = await Promise.all([
    listBusinessLocales(supabase, context.business.id),
    countActiveBusinessMedia(supabase, context.business.id),
    listBusinessDomains(supabase, context.business.id),
    listResolvedBusinessAppearances(supabase, context.business.id, context.modules),
  ]);
  const localeState = mapBusinessLocaleState(localeRows, context.business.default_locale);
  const primaryDomain = findPrimaryDomain(domains)?.hostname ?? null;
  const enabledModuleCount = context.modules.filter((module) => module.isEffectivelyEnabled).length;
  const appearanceContextCount = appearances.length;
  const configuredAppearanceCount = appearances.filter(
    (appearance) =>
      appearance.selectedTemplateKey !== null || Object.keys(appearance.overrides).length > 0,
  ).length;
  const overviewPath = businessPath(context.business.slug);

  return {
    activeMediaCount,
    appearanceContextCount,
    configuredAppearanceCount,
    domainCount: domains.length,
    enabledLocaleCount: localeState.enabledLocales.length,
    enabledModuleCount,
    primaryDomain,
    readiness: deriveAdminReadiness({
      appearanceContextCount,
      businessPath: overviewPath,
      businessProfileValid:
        context.business.display_name.trim().length > 0 && context.business.slug.length > 0,
      defaultLocaleEnabled: localeState.enabledLocales.includes(context.business.default_locale),
      enabledModuleCount,
      hasCompleteLocationVisibility:
        context.access.canReadAllLocations || context.access.canManageAllLocations,
      mediaAssetCount: activeMediaCount,
      primaryDomain,
      visibleLocationCount: context.locations.length,
    }),
    verifiedDomainCount: domains.filter((domain) => domain.status === "verified").length,
  };
}

async function countActiveBusinessMedia(
  supabase: DarbServerSupabaseClient,
  businessId: string,
): Promise<number> {
  const { count, error } = await supabase
    .schema("core")
    .from("media_assets")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("status", "active");

  if (error) {
    throw new Error(`Unable to resolve overview media state (${error.code}).`);
  }

  return count ?? 0;
}
