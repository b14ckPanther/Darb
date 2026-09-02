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
