import { describe, expect, it } from "vitest";

import {
  ModuleGateError,
  businessHasEnabledModule,
  mapBusinessModuleStates,
  requireEnabledBusinessModule,
  type PlatformModuleDefinition,
} from "./module-state";

const definitions: PlatformModuleDefinition[] = [
  {
    description: "Future restaurant capability.",
    displayName: "Restaurant",
    isAvailable: true,
    key: "restaurant",
    sortOrder: 10,
  },
  {
    description: "Future booking capability.",
    displayName: "Booking",
    isAvailable: false,
    key: "booking",
    sortOrder: 20,
  },
];

describe("business module state", () => {
  it("maps absent rows to disabled and active stored rows to effective enablement", () => {
    const modules = mapBusinessModuleStates(
      definitions,
      [
        {
          is_enabled: true,
          module_key: "restaurant",
          updated_at: "2026-09-01T09:00:00.000Z",
        },
      ],
      "active",
    );

    expect(modules[0]).toMatchObject({
      isEffectivelyEnabled: true,
      isEnabled: true,
      key: "restaurant",
    });
    expect(modules[1]).toMatchObject({
      isEffectivelyEnabled: false,
      isEnabled: false,
      key: "booking",
      updatedAt: null,
    });
    expect(businessHasEnabledModule(modules, "restaurant")).toBe(true);
    expect(businessHasEnabledModule(modules, "booking")).toBe(false);
  });

  it("retains stored state while platform availability keeps it ineffective", () => {
    const [module] = mapBusinessModuleStates(
      [definitions[1]!],
      [{ is_enabled: true, module_key: "booking", updated_at: "2026-09-01T09:00:00.000Z" }],
      "active",
    );

    expect(module).toMatchObject({ isEffectivelyEnabled: false, isEnabled: true });
  });

  it("treats enabled state as ineffective while the business is not active", () => {
    const [module] = mapBusinessModuleStates(
      [definitions[0]!],
      [{ is_enabled: true, module_key: "restaurant", updated_at: "2026-09-01T09:00:00.000Z" }],
      "archived",
    );

    expect(module?.isEffectivelyEnabled).toBe(false);
  });

  it("requires lifecycle, availability, and enablement at the server gate", () => {
    const enabled = mapBusinessModuleStates(
      [definitions[0]!],
      [{ is_enabled: true, module_key: "restaurant", updated_at: "2026-09-01T09:00:00.000Z" }],
      "active",
    );
    const disabled = mapBusinessModuleStates([definitions[0]!], [], "active");
    const unavailable = mapBusinessModuleStates(
      [definitions[1]!],
      [{ is_enabled: true, module_key: "booking", updated_at: "2026-09-01T09:00:00.000Z" }],
      "active",
    );

    expect(requireEnabledBusinessModule(enabled, "restaurant", "active").key).toBe("restaurant");
    expect(() => requireEnabledBusinessModule(disabled, "restaurant", "active")).toThrowError(
      new ModuleGateError("disabled"),
    );
    expect(() => requireEnabledBusinessModule(unavailable, "booking", "active")).toThrowError(
      new ModuleGateError("unavailable"),
    );
    expect(() => requireEnabledBusinessModule(enabled, "restaurant", "suspended")).toThrowError(
      new ModuleGateError("business-inactive"),
    );
    expect(() => requireEnabledBusinessModule(enabled, "commerce", "active")).toThrowError(
      new ModuleGateError("not-found"),
    );
  });
});
