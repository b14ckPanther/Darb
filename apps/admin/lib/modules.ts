import "server-only";

import type { DarbServerSupabaseClient } from "@darb/database/server";

import {
  mapBusinessModuleAccessRows,
  requireEnabledBusinessModule,
  type BusinessModuleState,
  type BusinessStatus,
} from "./module-state";

export async function listBusinessModuleStates(
  supabase: DarbServerSupabaseClient,
  businessId: string,
  businessStatus: BusinessStatus,
): Promise<BusinessModuleState[]> {
  void businessStatus;
  const { data, error } = await supabase
    .schema("core")
    .rpc("get_business_module_access", { target_business_id: businessId });
  if (error) throw new Error(`Unable to resolve business module access (${error.code}).`);
  return mapBusinessModuleAccessRows(data);
}

export interface BusinessCommercialSummary {
  currentLocations: number;
  initialSetupStatus: string;
  maxLocations: number | null;
  planDescription: string;
  planDisplayName: string;
  planKey: string;
}

export async function getBusinessCommercialSummary(
  supabase: DarbServerSupabaseClient,
  businessId: string,
): Promise<BusinessCommercialSummary> {
  const { data, error } = await supabase
    .schema("core")
    .rpc("get_business_commercial_summary", { target_business_id: businessId })
    .single();
  if (error || !data) {
    throw new Error(`Unable to resolve business commercial summary (${error?.code ?? "NO_DATA"}).`);
  }
  return {
    currentLocations: Number(data.current_locations),
    initialSetupStatus: data.initial_setup_status,
    maxLocations: data.max_locations,
    planDescription: data.plan_description,
    planDisplayName: data.plan_display_name,
    planKey: data.plan_key,
  };
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
