import type { Database } from "@darb/database/types";

export type BusinessStatus = Database["core"]["Enums"]["business_status"];

export interface PlatformModuleDefinition {
  description: string;
  displayName: string;
  isAvailable: boolean;
  key: string;
  sortOrder: number;
}

export interface BusinessModuleState extends PlatformModuleDefinition {
  entitlementSource: string;
  isEntitled: boolean;
  isEffectivelyEnabled: boolean;
  isEnabled: boolean;
  planKey: string | null;
  unavailableReason: string | null;
  updatedAt: string | null;
}

export interface BusinessModuleAccessRow {
  description: string;
  display_name: string;
  effective: boolean;
  enabled: boolean;
  entitled: boolean;
  entitlement_source: string;
  module_key: string;
  plan_key: string | null;
  platform_available: boolean;
  sort_order: number;
  unavailable_reason: string | null;
  updated_at: string | null;
}

export interface BusinessModuleStateRow {
  is_enabled: boolean;
  module_key: string;
  updated_at: string;
}

export type ModuleGateFailure =
  "business-inactive" | "disabled" | "not-entitled" | "not-found" | "unavailable";

export class ModuleGateError extends Error {
  constructor(readonly reason: ModuleGateFailure) {
    super(`Business module gate failed: ${reason}`);
    this.name = "ModuleGateError";
  }
}

export function mapBusinessModuleStates(
  definitions: PlatformModuleDefinition[],
  rows: BusinessModuleStateRow[],
  businessStatus: BusinessStatus,
): BusinessModuleState[] {
  const stateByKey = new Map(rows.map((row) => [row.module_key, row]));

  return definitions.map((definition) => {
    const state = stateByKey.get(definition.key);
    const isEnabled = state?.is_enabled === true;

    return {
      ...definition,
      entitlementSource: "legacy",
      isEntitled: true,
      isEffectivelyEnabled: businessStatus === "active" && definition.isAvailable && isEnabled,
      isEnabled,
      planKey: null,
      unavailableReason: null,
      updatedAt: state?.updated_at ?? null,
    };
  });
}

export function mapBusinessModuleAccessRows(
  rows: BusinessModuleAccessRow[],
): BusinessModuleState[] {
  return rows.map((row) => ({
    description: row.description,
    displayName: row.display_name,
    entitlementSource: row.entitlement_source,
    isAvailable: row.platform_available,
    isEffectivelyEnabled: row.effective,
    isEnabled: row.enabled,
    isEntitled: row.entitled,
    key: row.module_key,
    planKey: row.plan_key,
    sortOrder: row.sort_order,
    unavailableReason: row.unavailable_reason,
    updatedAt: row.updated_at,
  }));
}

export function businessHasEnabledModule(
  modules: BusinessModuleState[],
  moduleKey: string,
): boolean {
  return modules.some((module) => module.key === moduleKey && module.isEffectivelyEnabled);
}

export function requireEnabledBusinessModule(
  modules: BusinessModuleState[],
  moduleKey: string,
  businessStatus: BusinessStatus,
): BusinessModuleState {
  const capability = modules.find((candidate) => candidate.key === moduleKey);

  if (!capability) {
    throw new ModuleGateError("not-found");
  }

  if (businessStatus !== "active") {
    throw new ModuleGateError("business-inactive");
  }

  if (!capability.isAvailable) {
    throw new ModuleGateError("unavailable");
  }

  if (!capability.isEntitled) {
    throw new ModuleGateError("not-entitled");
  }

  if (!capability.isEnabled) {
    throw new ModuleGateError("disabled");
  }

  return capability;
}
