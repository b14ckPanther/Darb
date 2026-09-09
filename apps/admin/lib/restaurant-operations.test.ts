import { describe, expect, it } from "vitest";

import { buildRestaurantPublicUrl, filterRestaurantItems } from "./restaurant-operations";

const items = [
  {
    availabilityStatus: "available" as const,
    categoryId: "coffee",
    hasImage: true,
    internalName: "house-espresso",
    localizedName: "House espresso",
  },
  {
    availabilityStatus: "sold_out" as const,
    categoryId: "bakery",
    hasImage: false,
    internalName: "zaatar-croissant",
    localizedName: "كرواسون زعتر",
  },
];

describe("Restaurant Admin operations", () => {
  it("filters by localized text, operational state, category, and media", () => {
    expect(
      filterRestaurantItems(items, {
        availability: "sold_out",
        categoryId: "bakery",
        media: "without_image",
        query: "زعتر",
      }),
    ).toEqual([items[1]]);

    expect(
      filterRestaurantItems(items, {
        availability: "all",
        categoryId: "all",
        media: "all",
        query: "ESPRESSO",
      }),
    ).toEqual([items[0]]);
  });

  it("builds trusted platform and primary-domain preview URLs", () => {
    expect(
      buildRestaurantPublicUrl({
        businessSlug: "north-cafe",
        defaultLocale: "ar",
        locale: "ar",
        primaryHostname: null,
      }),
    ).toBe("https://rest.darb.co.il/north-cafe");
    expect(
      buildRestaurantPublicUrl({
        businessSlug: "north-cafe",
        defaultLocale: "ar",
        locale: "en",
        primaryHostname: "menu.north.example",
      }),
    ).toBe("https://menu.north.example/en");
  });
});
