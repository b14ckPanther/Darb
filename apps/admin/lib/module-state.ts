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
  isEffectivelyEnabled: boolean;
  isEnabled: boolean;
  updatedAt: string | null;
}

export interface BusinessModuleStateRow {
  is_enabled: boolean;
  module_key: string;
  updated_at: string;
}

export type ModuleGateFailure = "business-inactive" | "disabled" | "not-found" | "unavailable";

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
      isEffectivelyEnabled: businessStatus === "active" && definition.isAvailable && isEnabled,
      isEnabled,
      updatedAt: state?.updated_at ?? null,
    };
  });
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

  if (!capability.isEnabled) {
    throw new ModuleGateError("disabled");
  }

  return capability;
}
