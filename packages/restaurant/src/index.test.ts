import { describe, expect, it } from "vitest";

import {
  describeModifierSelection,
  isRestaurantCapabilityEffective,
  isRestaurantPublicExperienceEffective,
  resolveRestaurantItemAvailability,
} from "./index";

describe("Restaurant Engine domain helpers", () => {
  it("requires an active business and an enabled, available capability", () => {
    expect(
      isRestaurantCapabilityEffective({
        businessStatus: "active",
        moduleAvailable: true,
        moduleEnabled: true,
      }),
    ).toBe(true);
    expect(
      isRestaurantCapabilityEffective({
        businessStatus: "suspended",
        moduleAvailable: true,
        moduleEnabled: true,
      }),
    ).toBe(false);
    expect(
      isRestaurantCapabilityEffective({
        businessStatus: "active",
        moduleAvailable: false,
        moduleEnabled: true,
      }),
    ).toBe(false);
    expect(
      isRestaurantCapabilityEffective({
        businessStatus: "active",
        moduleAvailable: true,
        moduleEnabled: false,
      }),
    ).toBe(false);
  });

  it("keeps capability state separate from public activation", () => {
    expect(
      isRestaurantPublicExperienceEffective({
        businessStatus: "active",
        configured: true,
        moduleAvailable: true,
        moduleEnabled: true,
        publiclyActive: false,
      }),
    ).toBe(false);
    expect(
      isRestaurantPublicExperienceEffective({
        businessStatus: "active",
        configured: true,
        moduleAvailable: true,
        moduleEnabled: true,
        publiclyActive: true,
      }),
    ).toBe(true);
  });

  it("uses a location override when one exists and otherwise inherits base availability", () => {
    expect(resolveRestaurantItemAvailability("available", "sold_out")).toBe("sold_out");
    expect(resolveRestaurantItemAvailability("sold_out", null)).toBe("sold_out");
    expect(resolveRestaurantItemAvailability("available", undefined)).toBe("available");
  });

  it("derives required and multiple-selection behavior from normalized bounds", () => {
    expect(describeModifierSelection(0, 1)).toEqual({ allowsMultiple: false, required: false });
    expect(describeModifierSelection(1, 1)).toEqual({ allowsMultiple: false, required: true });
    expect(describeModifierSelection(0, 3)).toEqual({ allowsMultiple: true, required: false });
    expect(describeModifierSelection(1, 3)).toEqual({ allowsMultiple: true, required: true });
  });

  it("rejects invalid modifier bounds before presentation logic uses them", () => {
    expect(() => describeModifierSelection(-1, 1)).toThrow(RangeError);
    expect(() => describeModifierSelection(2, 1)).toThrow(RangeError);
    expect(() => describeModifierSelection(0, 0)).toThrow(RangeError);
    expect(() => describeModifierSelection(0.5, 1)).toThrow(RangeError);
  });
});
