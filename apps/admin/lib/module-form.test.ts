import { describe, expect, it } from "vitest";

import { parseModuleMutationInput } from "./module-form";

function moduleForm(moduleKey: string, enabled: string): FormData {
  const formData = new FormData();
  formData.set("moduleKey", moduleKey);
  formData.set("enabled", enabled);
  return formData;
}

describe("module mutation input", () => {
  it("accepts a stable registry key and explicit boolean state", () => {
    expect(parseModuleMutationInput(moduleForm("restaurant", "true"))).toEqual({
      data: { enabled: true, moduleKey: "restaurant" },
      success: true,
    });
    expect(parseModuleMutationInput(moduleForm("pages", "false"))).toEqual({
      data: { enabled: false, moduleKey: "pages" },
      success: true,
    });
  });

  it.each(["Restaurant", "restaurant.manage", "restaurant-engine", "", "1restaurant"])(
    "rejects the forged module key %s",
    (moduleKey) => {
      expect(parseModuleMutationInput(moduleForm(moduleKey, "true"))).toEqual({
        message: "That capability is not available.",
        success: false,
      });
    },
  );

  it("rejects an ambiguous requested state", () => {
    expect(parseModuleMutationInput(moduleForm("restaurant", "on"))).toEqual({
      message: "Choose a valid capability state.",
      success: false,
    });
  });
});
