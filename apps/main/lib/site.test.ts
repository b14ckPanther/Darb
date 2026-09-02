import { describe, expect, it } from "vitest";

import { supportedLocales } from "@darb/i18n";

import { mainSiteCopy } from "./copy";
import { serializeJsonLd } from "./seo";
import {
  defaultPublicLocale,
  getPublicAlternates,
  getPublicLocaleDirection,
  getPublicLocalePath,
  getPublicLocaleUrl,
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
});

describe("public copy", () => {
  it("ships complete localized content for every supported locale", () => {
    for (const locale of supportedLocales) {
      const copy = mainSiteCopy[locale];
      expect(copy.hero.titleLead.length).toBeGreaterThan(3);
      expect(copy.paths.items).toHaveLength(4);
      expect(copy.products.items).toHaveLength(4);
      expect(copy.foundation.items).toHaveLength(6);
      expect(copy.languages.scripts).toHaveLength(3);
      expect(copy.metadata.description.length).toBeGreaterThan(60);
    }
  });

  it("represents only Restaurant as currently available", () => {
    for (const locale of supportedLocales) {
      const current = mainSiteCopy[locale].products.items.filter((product) => product.current);
      expect(current.map((product) => product.key)).toEqual(["restaurant"]);
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
    expect(copy.hero.titleLead).toBe("شغلك.");
    expect(copy.hero.description).toContain("الأدوات اللي بتحتاجها اليوم");
    expect(copy.story.principle).toBe("أساس واحد. شغل مختلف. وكل واحد إله طريقه.");
    expect(copy.products.honestNote).toContain("مش متاحة هلا");

    for (const formalPhrase of ["تعذّر", "يمكنك", "انتقل إلى", "صُمم", "تمنح الأعمال"]) {
      expect(allArabicCopy).not.toContain(formalPhrase);
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
