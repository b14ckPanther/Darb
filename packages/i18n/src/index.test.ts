import { describe, expect, it } from "vitest";

import { getTextDirection, isSupportedLocale, supportedLocales } from "./index";

describe("Darb locale configuration", () => {
  it("supports the initial market languages", () => {
    expect(supportedLocales).toEqual(["ar", "he", "en"]);
  });

  it.each([
    ["ar", "rtl"],
    ["he", "rtl"],
    ["en", "ltr"],
  ] as const)("maps %s to %s direction", (locale, direction) => {
    expect(getTextDirection(locale)).toBe(direction);
  });

  it("narrows supported locale values", () => {
    expect(isSupportedLocale("ar")).toBe(true);
    expect(isSupportedLocale("fr")).toBe(false);
  });
});
