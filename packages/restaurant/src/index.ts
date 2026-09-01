import type { Database } from "@darb/database/types";

export const RESTAURANT_MODULE_KEY = "restaurant" as const;

export type RestaurantTables = Database["restaurant"]["Tables"];
export type RestaurantEnums = Database["restaurant"]["Enums"];
export type RestaurantConfiguration = RestaurantTables["configurations"]["Row"];
export type RestaurantMenu = RestaurantTables["menus"]["Row"];
export type RestaurantCategory = RestaurantTables["categories"]["Row"];
export type RestaurantItem = RestaurantTables["items"]["Row"];
export type RestaurantItemVariant = RestaurantTables["item_variants"]["Row"];
export type RestaurantModifierGroup = RestaurantTables["modifier_groups"]["Row"];
export type RestaurantModifier = RestaurantTables["modifiers"]["Row"];
export type RestaurantAvailability = RestaurantEnums["availability_status"];

export interface RestaurantCapabilityState {
  businessStatus: Database["core"]["Enums"]["business_status"];
  moduleAvailable: boolean;
  moduleEnabled: boolean;
}

export interface RestaurantPublicState extends RestaurantCapabilityState {
  configured: boolean;
  publiclyActive: boolean;
}

export interface RestaurantReadinessInput {
  activeCategoryCount: number;
  activeItemCount: number;
  activeMenuCount: number;
  configured: boolean;
  enabledLocaleCount: number;
  modifierGroupCount: number;
  publishedMenuCount: number;
  publiclyActive: boolean;
}

export interface RestaurantReadinessItem {
  key: "configuration" | "content" | "localization" | "modifiers" | "publication";
  label: string;
  ready: boolean;
  requirement: "optional" | "recommended" | "required";
}

export function isRestaurantCapabilityEffective(state: RestaurantCapabilityState): boolean {
  return state.businessStatus === "active" && state.moduleAvailable && state.moduleEnabled;
}

export function isRestaurantPublicExperienceEffective(state: RestaurantPublicState): boolean {
  return isRestaurantCapabilityEffective(state) && state.configured && state.publiclyActive;
}

export function resolveRestaurantItemAvailability(
  base: RestaurantAvailability,
  locationOverride: RestaurantAvailability | null | undefined,
): RestaurantAvailability {
  return locationOverride ?? base;
}

export function describeModifierSelection(
  minimumSelections: number,
  maximumSelections: number,
): { allowsMultiple: boolean; required: boolean } {
  if (
    !Number.isInteger(minimumSelections) ||
    !Number.isInteger(maximumSelections) ||
    minimumSelections < 0 ||
    maximumSelections < 1 ||
    minimumSelections > maximumSelections
  ) {
    throw new RangeError("Invalid modifier selection bounds");
  }

  return {
    allowsMultiple: maximumSelections > 1,
    required: minimumSelections > 0,
  };
}

export function parseMajorMoneyToMinor(value: string, fractionDigits = 2): number | null {
  if (!Number.isInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 4) {
    throw new RangeError("Invalid currency fraction digits");
  }

  const normalized = value.trim();
  const pattern = new RegExp(`^(?:0|[1-9]\\d*)(?:\\.(\\d{1,${fractionDigits}}))?$`);
  const match = pattern.exec(normalized);

  if (!match) return null;

  const scale = 10 ** fractionDigits;
  const whole = Number(normalized.split(".")[0]);
  const fraction = (match[1] ?? "").padEnd(fractionDigits, "0");
  const minor = whole * scale + Number(fraction || 0);

  return Number.isSafeInteger(minor) && minor <= 999_999_999 ? minor : null;
}

export function formatMinorMoneyInput(value: number, fractionDigits = 2): string {
  if (!Number.isSafeInteger(value) || value < 0 || !Number.isInteger(fractionDigits)) {
    throw new RangeError("Invalid minor-unit amount");
  }

  const scale = 10 ** fractionDigits;
  return `${Math.floor(value / scale)}.${String(value % scale).padStart(fractionDigits, "0")}`;
}

export function deriveRestaurantReadiness(
  input: RestaurantReadinessInput,
): RestaurantReadinessItem[] {
  return [
    {
      key: "configuration",
      label: "Restaurant configuration",
      ready: input.configured,
      requirement: "required",
    },
    {
      key: "content",
      label: "Menu structure",
      ready:
        input.activeMenuCount > 0 && input.activeCategoryCount > 0 && input.activeItemCount > 0,
      requirement: "required",
    },
    {
      key: "localization",
      label: "Enabled-language content",
      ready: input.enabledLocaleCount > 0,
      requirement: "required",
    },
    {
      key: "publication",
      label: "Publication intent",
      ready: input.publishedMenuCount > 0 && input.publiclyActive,
      requirement: "required",
    },
    {
      key: "modifiers",
      label: "Reusable modifiers",
      ready: input.modifierGroupCount > 0,
      requirement: "optional",
    },
  ];
}
