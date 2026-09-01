import { describe, expect, it } from "vitest";

import {
  parseItemInput,
  parseMenuInput,
  parsePricedChildInput,
  parseTranslationInput,
} from "./restaurant-form";

describe("Restaurant Admin form parsing", () => {
  it("normalizes a valid menu without trusting arbitrary lifecycle values", () => {
    const form = new FormData();
    form.set("internalName", "  Lunch  ");
    form.set("publicationStatus", "draft");
    form.set("lifecycleStatus", "active");
    form.set("displayOrder", "20");
    expect(parseMenuInput(form)).toEqual({
      data: {
        displayOrder: 20,
        internalName: "Lunch",
        lifecycleStatus: "active",
        publicationStatus: "draft",
      },
      success: true,
    });
    form.set("lifecycleStatus", "deleted");
    expect(parseMenuInput(form).success).toBe(false);
  });

  it("converts item money exactly and rejects forged tenant relationships", () => {
    const form = new FormData();
    form.set("menuId", "7a94feaf-766e-4e0e-939e-82149f1fdb42");
    form.set("categoryId", "cb925232-2c2d-4a35-ad22-311b39263fc4");
    form.set("internalName", "Espresso");
    form.set("price", "12.50");
    form.set("availabilityStatus", "available");
    form.set("lifecycleStatus", "active");
    form.set("displayOrder", "0");
    expect(parseItemInput(form)).toEqual({
      data: expect.objectContaining({ basePriceMinor: 1250, internalName: "Espresso" }),
      success: true,
    });
    form.set("categoryId", "not-a-uuid");
    expect(parseItemInput(form).success).toBe(false);
  });

  it("rejects malformed variant and modifier prices", () => {
    const form = new FormData();
    form.set("internalName", "Large");
    form.set("price", "10.999");
    form.set("availabilityStatus", "available");
    form.set("lifecycleStatus", "active");
    form.set("displayOrder", "1");
    expect(parsePricedChildInput(form).success).toBe(false);
  });

  it("allows only supported localized entity types and Darb locales", () => {
    const form = new FormData();
    form.set("entityType", "item");
    form.set("locale", "ar");
    form.set("name", "قهوة");
    expect(parseTranslationInput(form).success).toBe(true);
    form.set("locale", "fr");
    expect(parseTranslationInput(form).success).toBe(false);
    form.set("locale", "ar");
    form.set("entityType", "order");
    expect(parseTranslationInput(form).success).toBe(false);
  });
});
