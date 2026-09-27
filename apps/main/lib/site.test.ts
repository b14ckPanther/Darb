import { describe, expect, it } from "vitest";

import { supportedLocales } from "@darb/i18n";

import { mainSiteCopy } from "./copy";
import { serializeJsonLd } from "./seo";
import {
  defaultPublicLocale,
  getAdminSignInUrl,
  getAdminRegistrationUrl,
  getPublicAlternates,
  getPublicLocaleDirection,
  getPublicLocalePath,
  getPublicLocaleUrl,
  getRestaurantLandingUrl,
  resolvePublicLocale,
} from "./site";

function collectKeyPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectKeyPaths(item, `${prefix}[]`));
  }

  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, nestedValue]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return [path, ...collectKeyPaths(nestedValue, path)];
    });
  }

  return [];
}

describe("public locale routing", () => {
  it("uses Arabic as the deliberate default and stable locale paths", () => {
    expect(defaultPublicLocale).toBe("ar");
    expect(supportedLocales.map(getPublicLocalePath)).toEqual(["/ar", "/he", "/en"]);
    expect(getPublicLocaleUrl("he")).toBe("https://darb.co.il/he");
  });

  it("rejects unsupported locale values and resolves writing direction", () => {
    expect(resolvePublicLocale("ar")).toBe("ar");
    expect(resolvePublicLocale("fr")).toBeNull();
    expect(getPublicLocaleDirection("ar")).toBe("rtl");
    expect(getPublicLocaleDirection("he")).toBe("rtl");
    expect(getPublicLocaleDirection("en")).toBe("ltr");
  });

  it("publishes deterministic language alternates and a root x-default", () => {
    expect(getPublicAlternates()).toEqual({
      "ar-IL": "https://darb.co.il/ar",
      "he-IL": "https://darb.co.il/he",
      "en-IL": "https://darb.co.il/en",
      "x-default": "https://darb.co.il/",
    });
  });

  it("hands the selected Main locale to the Admin login boundary", () => {
    expect(getAdminSignInUrl("ar")).toBe("https://admin.darb.co.il/login?locale=ar");
    expect(getAdminSignInUrl("he")).toBe("https://admin.darb.co.il/login?locale=he");
    expect(getAdminSignInUrl("en")).toBe("https://admin.darb.co.il/login?locale=en");
  });

  it("hands the selected Main locale to the registration boundary", () => {
    expect(getAdminRegistrationUrl("ar")).toBe("https://admin.darb.co.il/register?locale=ar");
    expect(getAdminRegistrationUrl("he")).toBe("https://admin.darb.co.il/register?locale=he");
    expect(getAdminRegistrationUrl("en")).toBe("https://admin.darb.co.il/register?locale=en");
  });

  it("links to the Restaurant landing in the selected Main locale", () => {
    expect(getRestaurantLandingUrl("ar")).toBe("https://rest.darb.co.il/ar");
    expect(getRestaurantLandingUrl("he")).toBe("https://rest.darb.co.il/he");
    expect(getRestaurantLandingUrl("en")).toBe("https://rest.darb.co.il/en");
  });
});

describe("public copy", () => {
  it("ships complete localized content for every supported locale", () => {
    for (const locale of supportedLocales) {
      const copy = mainSiteCopy[locale];
      expect(copy.hero.titleLead.length).toBeGreaterThan(3);
      expect(copy.junction.destinations).toHaveLength(4);
      expect(copy.restaurant.layers).toHaveLength(6);
      expect(copy.foundation.items).toHaveLength(6);
      expect(Object.keys(copy.languages.directions)).toEqual(["rtl", "ltr"]);
      expect(copy.metadata.description.length).toBeGreaterThan(60);
    }
  });

  it("represents only Restaurant as currently available, first on the route", () => {
    for (const locale of supportedLocales) {
      const destinations = mainSiteCopy[locale].junction.destinations;
      expect(destinations.map((destination) => destination.key)).toEqual([
        "restaurant",
        "booking",
        "pages",
        "commerce",
      ]);
      expect(destinations.filter((destination) => destination.current).map((d) => d.key)).toEqual([
        "restaurant",
      ]);
    }
  });

  it("states the Restaurant boundary honestly instead of implying ordering", () => {
    expect(mainSiteCopy.en.restaurant.boundary).toContain("not part of the Restaurant path yet");
    for (const locale of supportedLocales) {
      expect(mainSiteCopy[locale].restaurant.boundary.length).toBeGreaterThan(10);
    }
  });

  it("keeps the localized resource shape aligned", () => {
    const referenceShape = collectKeyPaths(mainSiteCopy.en);

    expect(collectKeyPaths(mainSiteCopy.ar)).toEqual(referenceShape);
    expect(collectKeyPaths(mainSiteCopy.he)).toEqual(referenceShape);
  });

  it("uses deliberate conversational Arabic rather than formal translated phrasing", () => {
    const copy = mainSiteCopy.ar;
    const allArabicCopy = JSON.stringify(copy);

    expect(copy.nav.story).toBe("شو هو درب");
    expect(copy.hero.titleLead).toBe("مجالات كثيرة.");
    expect(copy.hero.titleAccent).toBe("درب واحد.");
    expect(copy.hero.description).toContain("درب ببني لشغلك عالمه الرقمي الخاص");
    expect(copy.story.principle).toBe("كل مجال إله منطقه. ودرب مبني على هالفكرة.");
    expect(copy.junction.note).toContain("درب عنده أكثر بكثير ليقدّمه");

    for (const formalPhrase of ["تعذّر", "يمكنك", "انتقل إلى", "صُمم", "تمنح الأعمال"]) {
      expect(allArabicCopy).not.toContain(formalPhrase);
    }
  });

  it("keeps visible copy free of em dashes outside the SEO titles", () => {
    for (const locale of supportedLocales) {
      const { metadata, ...visible } = mainSiteCopy[locale];
      expect(metadata.title.length).toBeGreaterThan(10);
      expect(JSON.stringify(visible)).not.toMatch(/[\u2013\u2014]/);
    }
  });
});

describe("safe public structured data", () => {
  it("escapes HTML-significant characters", () => {
    const serialized = serializeJsonLd({ name: "</script><script>&" });
    expect(serialized).not.toContain("<");
    expect(serialized).not.toContain(">");
    expect(serialized).not.toContain("&");
    expect(serialized).toContain("\\u003c/script\\u003e");
  });
});
