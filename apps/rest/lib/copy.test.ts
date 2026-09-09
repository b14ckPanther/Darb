import { describe, expect, it } from "vitest";

import { supportedLocales } from "@darb/i18n";

import { getRestaurantCopy } from "./copy";

describe("Restaurant-owned public copy", () => {
  it("provides complete system and interaction copy for every locale", () => {
    for (const locale of supportedLocales) {
      const copy = getRestaurantCopy(locale);
      expect(copy.landingTitle).toBeTruthy();
      expect(copy.loadErrorTitle).toBeTruthy();
      expect(copy.loading).toBeTruthy();
      expect(copy.soldOut).toBeTruthy();
      expect(copy.pauseHeroVideo).toBeTruthy();
      expect(copy.playHeroVideo).toBeTruthy();
    }
  });

  it("formats selection counts using the selected locale", () => {
    expect(getRestaurantCopy("ar").selections(1_000, 2_000)).toContain(
      new Intl.NumberFormat("ar").format(1_000),
    );
    expect(getRestaurantCopy("en").selections(1_000, 2_000)).toContain("1,000");
  });
});
