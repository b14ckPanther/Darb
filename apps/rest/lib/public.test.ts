import { describe, expect, it } from "vitest";

import { localizeRestaurantPublication, type PublicRestaurantPublication } from "@darb/restaurant";
import { safeFallbackTheme } from "@darb/theme";

import { buildRestaurantImageUrl } from "./media";
import {
  parseLocaleSegments,
  readSingleSearchParameter,
  restaurantCanonicalUrl,
  restaurantPath,
} from "./routes";
import {
  createRestaurantJsonLd,
  createRestaurantLanguageAlternates,
  createRestaurantMetadata,
  createRestaurantRobots,
  createRestaurantSitemap,
  serializeJsonLd,
} from "./seo";
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

  it("builds slug-free custom paths and trusted canonical origins", () => {
    const route = {
      hostname: "menu.example",
      kind: "custom",
      primaryHostname: "menu.example",
    } as const;
    expect(restaurantPath("public-fixture", "ar", "ar", null, route)).toBe("/");
    expect(restaurantPath("public-fixture", "en", "ar", "location id", route)).toBe(
      "/en?location=location+id",
    );
    expect(restaurantCanonicalUrl("public-fixture", "en", "ar", route).toString()).toBe(
      "https://menu.example/en",
    );
  });

  it("canonicalizes a non-primary custom host to the trusted primary", () => {
    const route = {
      hostname: "alternate.example",
      kind: "custom",
      primaryHostname: "primary.example",
    } as const;
    expect(restaurantCanonicalUrl("public-fixture", "ar", "ar", route).toString()).toBe(
      "https://primary.example/",
    );
  });

  it("never promotes an untrusted request hostname into a canonical origin", () => {
    expect(
      restaurantCanonicalUrl("public-fixture", "en", "ar", {
        hostname: "attacker.example",
        kind: "custom",
        primaryHostname: null,
      }).toString(),
    ).toBe("https://rest.darb.co.il/public-fixture/en");
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
    expect(metadata.alternates?.languages).toMatchObject({
      "ar-IL": "https://rest.darb.co.il/public-fixture",
      "en-IL": "https://rest.darb.co.il/public-fixture/en",
      "he-IL": "https://rest.darb.co.il/public-fixture/he",
      "x-default": "https://rest.darb.co.il/public-fixture",
    });
    expect(metadata.openGraph).toMatchObject({
      locale: "en_IL",
      url: "https://rest.darb.co.il/public-fixture/en",
    });
    expect(metadata.twitter).toMatchObject({ card: "summary" });
    expect(JSON.stringify(metadata)).not.toContain("internal_name");
  });

  it("uses only a trusted primary custom hostname throughout metadata", () => {
    const localized = localizeRestaurantPublication(publication, "he");
    const metadata = createRestaurantMetadata(publication, localized, {
      hostname: "alternate.example",
      kind: "custom",
      primaryHostname: "primary.example",
    });
    expect(metadata.alternates?.canonical?.toString()).toBe("https://primary.example/he");
    expect(metadata.alternates?.languages).toMatchObject({
      "ar-IL": "https://primary.example/",
      "en-IL": "https://primary.example/en",
      "he-IL": "https://primary.example/he",
      "x-default": "https://primary.example/",
    });
    expect(metadata.openGraph).toMatchObject({ url: "https://primary.example/he" });
  });

  it("adds public social images and exact variant offers without leaking paths", () => {
    const withMedia: PublicRestaurantPublication = {
      ...publication,
      menus: publication.menus.map((menu) => ({
        ...menu,
        categories: menu.categories.map((category) => ({
          ...category,
          image: {
            altText: "Public dish",
            height: 900,
            storageBucket: "tenant-media-images",
            storagePath: "public-fixture/dish.png",
            width: 1600,
          },
          items: category.items.map((item) => ({
            ...item,
            variants: [
              {
                availabilityStatus: "available",
                id: "variant-1",
                priceMinor: 2599,
                translations: [{ locale: "en", name: "Large" }],
              },
            ],
          })),
        })),
      })),
    };
    const localized = localizeRestaurantPublication(withMedia, "en");
    const metadata = createRestaurantMetadata(
      withMedia,
      localized,
      { kind: "platform", primaryHostname: null },
      "https://project.supabase.co",
    );
    expect(metadata.openGraph).toMatchObject({
      images: [
        {
          alt: "Public dish",
          height: 900,
          url: "https://project.supabase.co/storage/v1/object/public/tenant-media-images/public-fixture/dish.png",
          width: 1600,
        },
      ],
    });
    const serialized = serializeJsonLd(
      createRestaurantJsonLd(
        localized,
        { kind: "platform", primaryHostname: null },
        "https://project.supabase.co",
      ),
    );
    expect(serialized).toContain('"price":"25.99"');
    expect(serialized).toContain('"image":"https://project.supabase.co/storage/v1/object/public/');
    expect(serialized).not.toContain("internal");
  });

  it("builds canonical multilingual sitemaps and honest robots policies", () => {
    expect(
      createRestaurantSitemap([
        {
          businessSlug: "public-fixture",
          defaultLocale: "ar",
          locales: ["ar", "en"],
          primaryHostname: null,
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        url: "https://rest.darb.co.il/public-fixture",
        alternates: {
          languages: expect.objectContaining({
            "ar-IL": "https://rest.darb.co.il/public-fixture",
            "en-IL": "https://rest.darb.co.il/public-fixture/en",
            "x-default": "https://rest.darb.co.il/public-fixture",
          }),
        },
      }),
      expect.objectContaining({ url: "https://rest.darb.co.il/public-fixture/en" }),
    ]);
    expect(createRestaurantRobots(false, "https://darb.co.il")).toEqual({
      rules: { disallow: "/", userAgent: "*" },
    });
    expect(createRestaurantRobots(true, "https://menu.example")).toMatchObject({
      rules: { allow: "/", disallow: "/darb-host-internal/", userAgent: "*" },
      sitemap: "https://menu.example/sitemap.xml",
    });
    expect(
      createRestaurantLanguageAlternates("public-fixture", ["ar"], "ar", {
        hostname: "request.example",
        kind: "custom",
        primaryHostname: null,
      }),
    ).toEqual({
      "ar-IL": "https://rest.darb.co.il/public-fixture",
      "x-default": "https://rest.darb.co.il/public-fixture",
    });
  });

  it("emits honest menu JSON-LD with exact price and availability", () => {
    const jsonLd = createRestaurantJsonLd(localizeRestaurantPublication(publication, "en"));
    const serialized = serializeJsonLd(jsonLd);
    expect(serialized).toContain('"price":"12.99"');
    expect(serialized).toContain("https://schema.org/SoldOut");
    expect(serialized).not.toContain("<script");
    expect(serializeJsonLd({ value: "</script>" })).toContain("\\u003c/script>");
    expect(serializeJsonLd({ value: "before\u2028after\u2029end" })).toContain(
      "before\\u2028after\\u2029end",
    );
  });
});
