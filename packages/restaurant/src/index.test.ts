import { describe, expect, it } from "vitest";

import {
  deriveRestaurantReadiness,
  describeModifierSelection,
  formatMinorMoneyInput,
  formatRestaurantMoney,
  isRestaurantCapabilityEffective,
  isRestaurantPublicExperienceEffective,
  localizeRestaurantPublication,
  parseMajorMoneyToMinor,
  parsePublicRestaurantPublication,
  restaurantMoneyToDecimalString,
  resolvePublicRestaurantLocale,
  resolvePublicRestaurantTranslation,
  resolveRestaurantItemAvailability,
} from "./index";
import type { PublicRestaurantPublication } from "./public";

describe("Restaurant Engine domain helpers", () => {
  it("serializes minor-unit prices without floating-point conversion", () => {
    expect(restaurantMoneyToDecimalString(123456789, "ILS")).toBe("1234567.89");
    expect(restaurantMoneyToDecimalString(500, "JPY")).toBe("500");
  });
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

  it("converts human-entered prices to exact minor units without floating point math", () => {
    expect(parseMajorMoneyToMinor("12.34")).toBe(1234);
    expect(parseMajorMoneyToMinor("0.5")).toBe(50);
    expect(parseMajorMoneyToMinor("12.345")).toBeNull();
    expect(parseMajorMoneyToMinor("-1")).toBeNull();
    expect(parseMajorMoneyToMinor("9999999.99")).toBe(999_999_999);
    expect(parseMajorMoneyToMinor("10000000.00")).toBeNull();
    expect(formatMinorMoneyInput(1234)).toBe("12.34");
  });

  it("derives factual Restaurant setup states without a fabricated score", () => {
    expect(
      deriveRestaurantReadiness({
        activeCategoryCount: 1,
        activeItemCount: 2,
        activeMenuCount: 1,
        configured: true,
        enabledLocaleCount: 2,
        modifierGroupCount: 0,
        publishedMenuCount: 0,
        publiclyActive: false,
      }),
    ).toEqual([
      expect.objectContaining({ key: "configuration", ready: true }),
      expect.objectContaining({ key: "content", ready: true }),
      expect.objectContaining({ key: "localization", ready: true }),
      expect.objectContaining({ key: "publication", ready: false }),
      expect.objectContaining({ key: "modifiers", ready: false, requirement: "optional" }),
    ]);
  });

  it("validates the curated public projection before rendering", () => {
    expect(parsePublicRestaurantPublication(publicationFixture)).toEqual(publicationFixture);
    expect(parsePublicRestaurantPublication({ ...publicationFixture, version: 2 })).toBeNull();
    expect(parsePublicRestaurantPublication({ ...publicationFixture, locales: ["en"] })).toBeNull();
    expect(
      parsePublicRestaurantPublication({
        ...publicationFixture,
        menus: [{ ...publicationFixture.menus[0], id: null }],
      }),
    ).toBeNull();
  });

  it("resolves only an enabled public route locale", () => {
    expect(resolvePublicRestaurantLocale(null, ["ar", "en"], "ar")).toBe("ar");
    expect(resolvePublicRestaurantLocale("en", ["ar", "en"], "ar")).toBe("en");
    expect(resolvePublicRestaurantLocale("he", ["ar", "en"], "ar")).toBeNull();
    expect(resolvePublicRestaurantLocale("fr", ["ar", "en"], "ar")).toBeNull();
  });

  it("falls back requested locale to default and then deterministic enabled content", () => {
    const translations = [
      { description: null, locale: "ar" as const, name: "العربية" },
      { description: null, locale: "en" as const, name: "English" },
    ];
    expect(resolvePublicRestaurantTranslation(translations, "en", "ar", ["ar", "en"])?.name).toBe(
      "English",
    );
    expect(
      resolvePublicRestaurantTranslation(translations, "he", "ar", ["ar", "he", "en"])?.name,
    ).toBe("العربية");
    expect(
      resolvePublicRestaurantTranslation([translations[1]!], "he", "ar", ["ar", "he", "en"])?.name,
    ).toBe("English");
  });

  it("localizes the menu graph and applies only the selected location override", () => {
    const localized = localizeRestaurantPublication(publicationFixture, "en", "location-a");
    expect(localized.locale).toBe("en");
    expect(localized.selectedLocation?.displayName).toBe("Jerusalem");
    expect(localized.menus[0]?.name).toBe("Menu");
    expect(localized.menus[0]?.categories[0]?.items[0]).toMatchObject({
      availabilityStatus: "sold_out",
      name: "Dish",
    });
    expect(localized.menus[0]?.categories[0]?.items[0]?.variants[0]?.name).toBe("Large");
    expect(localized.menus[0]?.categories[0]?.items[0]?.modifierGroups[0]).toMatchObject({
      maximumSelections: 2,
      name: "Extras",
    });
  });

  it("formats integer minor units exactly with locale currency placement", () => {
    expect(formatRestaurantMoney(4500, "ILS", "en")).toBe("₪45");
    expect(formatRestaurantMoney(4550, "ILS", "en")).toBe("₪45.50");
    expect(formatRestaurantMoney(500, "ILS", "en", true)).toContain("+");
    expect(formatRestaurantMoney(4500, "ILS", "ar")).toContain("٤٥");
    expect(() => formatRestaurantMoney(-1, "ILS", "en")).toThrow(RangeError);
  });
});

const publicationFixture: PublicRestaurantPublication = {
  appearance: {
    defaultTheme: {},
    overrides: {},
    templateKey: "restaurant-signature",
    templateVersion: 1,
    themeSchemaVersion: 1,
  },
  business: {
    currencyCode: "ILS",
    defaultLocale: "ar",
    displayName: "Business",
    slug: "business",
    timezone: "Asia/Jerusalem",
  },
  locales: ["ar", "en"],
  locations: [
    {
      addressLine: "1 Street",
      countryCode: "IL",
      displayName: "Jerusalem",
      id: "location-a",
      locality: "Jerusalem",
      postalCode: null,
      timezone: "Asia/Jerusalem",
    },
  ],
  menus: [
    {
      categories: [
        {
          id: "category-a",
          image: null,
          items: [
            {
              availabilityStatus: "available",
              basePriceMinor: 4500,
              id: "item-a",
              image: null,
              locationAvailability: [{ availabilityStatus: "sold_out", locationId: "location-a" }],
              modifierGroups: [
                {
                  id: "group-a",
                  maximumSelections: 2,
                  minimumSelections: 0,
                  modifiers: [
                    {
                      availabilityStatus: "available",
                      id: "modifier-a",
                      priceDeltaMinor: 500,
                      translations: [{ locale: "en", name: "Extra" }],
                    },
                  ],
                  translations: [{ description: null, locale: "en", name: "Extras" }],
                },
              ],
              translations: [{ description: "Description", locale: "en", name: "Dish" }],
              variants: [
                {
                  availabilityStatus: "available",
                  id: "variant-a",
                  priceMinor: 5500,
                  translations: [{ locale: "en", name: "Large" }],
                },
              ],
            },
          ],
          translations: [{ description: null, locale: "en", name: "Category" }],
        },
      ],
      id: "menu-a",
      translations: [{ description: null, locale: "en", name: "Menu" }],
    },
  ],
  version: 1,
};
