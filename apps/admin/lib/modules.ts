import "server-only";

import type { DarbServerSupabaseClient } from "@darb/database/server";

import {
  mapBusinessModuleStates,
  requireEnabledBusinessModule,
  type BusinessModuleState,
  type BusinessStatus,
} from "./module-state";

export async function listBusinessModuleStates(
  supabase: DarbServerSupabaseClient,
  businessId: string,
  businessStatus: BusinessStatus,
): Promise<BusinessModuleState[]> {
  const [definitionsResult, stateResult] = await Promise.all([
    supabase
      .schema("core")
      .from("modules")
      .select("key, display_name, description, is_available, sort_order")
      .order("sort_order", { ascending: true })
      .order("key", { ascending: true }),
    supabase
      .schema("core")
      .from("business_modules")
      .select("module_key, is_enabled, updated_at")
      .eq("business_id", businessId),
  ]);

  if (definitionsResult.error) {
    throw new Error(`Unable to resolve platform modules (${definitionsResult.error.code}).`);
  }

  if (stateResult.error) {
    throw new Error(`Unable to resolve business module state (${stateResult.error.code}).`);
  }

  return mapBusinessModuleStates(
    definitionsResult.data.map((definition) => ({
      description: definition.description,
      displayName: definition.display_name,
      isAvailable: definition.is_available,
      key: definition.key,
      sortOrder: definition.sort_order,
    })),
    stateResult.data,
    businessStatus,
  );
}

export async function businessHasModule(
  supabase: DarbServerSupabaseClient,
  businessId: string,
  businessStatus: BusinessStatus,
  moduleKey: string,
): Promise<boolean> {
  const modules = await listBusinessModuleStates(supabase, businessId, businessStatus);
  return modules.some((module) => module.key === moduleKey && module.isEffectivelyEnabled);
}

export async function requireBusinessModule(
  supabase: DarbServerSupabaseClient,
  businessId: string,
  businessStatus: BusinessStatus,
  moduleKey: string,
): Promise<BusinessModuleState> {
  const modules = await listBusinessModuleStates(supabase, businessId, businessStatus);
  return requireEnabledBusinessModule(modules, moduleKey, businessStatus);
}
