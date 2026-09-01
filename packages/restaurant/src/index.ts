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
