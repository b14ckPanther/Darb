import { describe, expect, it } from "vitest";

import { localizeRestaurantPublication, type PublicRestaurantPublication } from "@darb/restaurant";
import { safeFallbackTheme } from "@darb/theme";

import { buildRestaurantImageUrl } from "./media";
import { restaurantPath, parseLocaleSegments, readSingleSearchParameter } from "./routes";
import { createRestaurantJsonLd, createRestaurantMetadata, serializeJsonLd } from "./seo";
import { resolveRestaurantTheme } from "./theme";

const publication: PublicRestaurantPublication = {
  appearance: {
    defaultTheme: safeFallbackTheme,
    overrides: { colors: { accent: "#9A452E" } },
    templateKey: "restaurant-signature",
    templateVersion: 1,
    themeSchemaVersion: 1,
  },
  business: {
    currencyCode: "ILS",
    defaultLocale: "ar",
    displayName: "Public fixture",
    slug: "public-fixture",
    timezone: "Asia/Jerusalem",
  },
  locales: ["ar", "he", "en"],
  locations: [],
  menus: [
    {
      categories: [
        {
          id: "category-1",
          image: null,
          items: [
            {
              availabilityStatus: "sold_out",
              basePriceMinor: 1299,
              id: "item-1",
              image: null,
              locationAvailability: [],
              modifierGroups: [],
              translations: [
                { description: "وصف آمن", locale: "ar", name: "صنف" },
                { description: "Safe description", locale: "en", name: "Item" },
              ],
              variants: [],
            },
          ],
          translations: [
            { description: null, locale: "ar", name: "قسم" },
            { description: null, locale: "en", name: "Section" },
          ],
        },
      ],
      id: "menu-1",
      translations: [
        { description: "وصف القائمة", locale: "ar", name: "القائمة" },
        { description: "Menu description", locale: "en", name: "Menu" },
      ],
    },
  ],
  version: 1,
};

describe("public Restaurant app helpers", () => {
  it("builds canonical locale and location paths", () => {
    expect(restaurantPath("public-fixture", "ar", "ar")).toBe("/public-fixture");
    expect(restaurantPath("public-fixture", "en", "ar", "location id")).toBe(
      "/public-fixture/en?location=location+id",
    );
  });

  it("rejects ambiguous route and search parameter shapes", () => {
    expect(parseLocaleSegments(undefined)).toBeNull();
    expect(parseLocaleSegments(["en"])).toBe("en");
    expect(parseLocaleSegments(["en", "extra"])).toBe("__invalid__");
    expect(readSingleSearchParameter(["one", "two"])).toBeNull();
  });

  it("constructs only encoded URLs in the public image bucket", () => {
    expect(
      buildRestaurantImageUrl("http://127.0.0.1:54321", {
        altText: null,
        height: 900,
        storageBucket: "tenant-media-images",
        storagePath: "tenant folder/menu image.png",
        width: 1600,
      }),
    ).toBe(
      "http://127.0.0.1:54321/storage/v1/object/public/tenant-media-images/tenant%20folder/menu%20image.png",
    );
    expect(() =>
      buildRestaurantImageUrl("http://127.0.0.1:54321", {
        altText: null,
        height: null,
        storageBucket: "private",
        storagePath: "secret.png",
        width: null,
      }),
    ).toThrow("Unsupported");
  });

  it("resolves validated appearance tokens for the active locale", () => {
    const variables = resolveRestaurantTheme(publication.appearance, "ar");
    expect(variables["--darb-theme-accent"]).toBe("#9A452E");
    expect(variables["--darb-theme-font-family"]).toContain("--font-cairo");
  });

  it("creates locale-aware canonical metadata without admin fields", () => {
    const localized = localizeRestaurantPublication(publication, "en");
    const metadata = createRestaurantMetadata(publication, localized);
    expect(metadata.alternates?.canonical?.toString()).toBe(
      "https://rest.darb.co.il/public-fixture/en",
    );
    expect(metadata.title).toBe("Public fixture · Menu");
    expect(JSON.stringify(metadata)).not.toContain("internal_name");
  });

  it("emits honest menu JSON-LD with exact price and availability", () => {
    const jsonLd = createRestaurantJsonLd(localizeRestaurantPublication(publication, "en"));
    const serialized = serializeJsonLd(jsonLd);
    expect(serialized).toContain('"price":"12.99"');
    expect(serialized).toContain("https://schema.org/SoldOut");
    expect(serialized).not.toContain("<script");
    expect(serializeJsonLd({ value: "</script>" })).toContain("\\u003c/script>");
  });
});
