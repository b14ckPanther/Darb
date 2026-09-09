import { describe, expect, it } from "vitest";

import { createAdminTranslator, resolveAdminLocale } from "./i18n";
import { adminMessageKeys, getAdminMessages } from "./messages";

describe("Admin localization", () => {
  it("resolves the cookie before the saved profile preference", () => {
    expect(resolveAdminLocale("ar", "he")).toBe("ar");
    expect(resolveAdminLocale(undefined, "he")).toBe("he");
    expect(resolveAdminLocale("unsupported", "unsupported")).toBe("en");
  });

  it("translates and interpolates without changing unknown technical values", () => {
    const t = createAdminTranslator("ar", getAdminMessages("ar"));
    expect(t("Business settings")).toBe("إعدادات الشغل");
    expect(t("{count} locations", { count: 3 })).toContain("3");
    expect(t("restaurant.manage")).toBe("restaurant.manage");
  });

  it("keeps Arabic and Hebrew catalogues aligned", () => {
    const arabic = getAdminMessages("ar");
    const hebrew = getAdminMessages("he");
    expect(adminMessageKeys.length).toBeGreaterThan(500);
    expect(Object.keys(arabic).sort()).toEqual(Object.keys(hebrew).sort());
    expect(adminMessageKeys.every((key) => arabic[key] && hebrew[key])).toBe(true);
  });
});
