import { describe, expect, it } from "vitest";

import {
  isValidCurrencyCode,
  parseBusinessBootstrapInput,
  parseBusinessSettingsInput,
  parseLocationInput,
  parseLoginInput,
} from "./forms";

describe("parseLoginInput", () => {
  it("normalizes a valid email without altering the password", () => {
    const formData = new FormData();
    formData.set("email", "  OWNER@Example.COM ");
    formData.set("password", " keep-my-spacing ");

    expect(parseLoginInput(formData)).toEqual({
      data: { email: "owner@example.com", password: " keep-my-spacing " },
      success: true,
    });
  });

  it("returns field errors for malformed credentials", () => {
    const formData = new FormData();
    formData.set("email", "not-an-email");

    expect(parseLoginInput(formData)).toEqual({
      errors: {
        email: "Enter a valid email address.",
        password: "Enter your password.",
      },
      success: false,
    });
  });
});

describe("parseBusinessBootstrapInput", () => {
  it("normalizes the business identity fields", () => {
    const formData = new FormData();
    formData.set("displayName", "  درب الأعمال  ");
    formData.set("slug", "  DARB-BUSINESS  ");
    formData.set("defaultLocale", "ar");

    expect(parseBusinessBootstrapInput(formData)).toEqual({
      data: {
        defaultLocale: "ar",
        displayName: "درب الأعمال",
        slug: "darb-business",
      },
      success: true,
    });
  });

  it("rejects an invalid slug and unsupported locale", () => {
    const formData = new FormData();
    formData.set("displayName", "Business");
    formData.set("slug", "bad slug");
    formData.set("defaultLocale", "fr");

    expect(parseBusinessBootstrapInput(formData)).toEqual({
      errors: {
        defaultLocale: "Choose Arabic, Hebrew, or English.",
        slug: "Use 3–63 lowercase letters, numbers, and single hyphens.",
      },
      success: false,
    });
  });

  it("rejects missing business identity data", () => {
    expect(parseBusinessBootstrapInput(new FormData())).toEqual({
      errors: {
        defaultLocale: "Choose Arabic, Hebrew, or English.",
        displayName: "Enter a business name between 1 and 160 characters.",
        slug: "Use 3–63 lowercase letters, numbers, and single hyphens.",
      },
      success: false,
    });
  });
});

describe("parseBusinessSettingsInput", () => {
  it("normalizes editable core business settings", () => {
    const formData = new FormData();
    formData.set("displayName", "  Darb Core  ");
    formData.set("slug", "  DARB-CORE  ");
    formData.set("defaultLocale", "he");
    formData.set("timezone", "Asia/Jerusalem");
    formData.set("status", "archived");

    expect(parseBusinessSettingsInput(formData)).toEqual({
      data: {
        defaultLocale: "he",
        displayName: "Darb Core",
        slug: "darb-core",
        status: "archived",
        timezone: "Asia/Jerusalem",
      },
      success: true,
    });
  });

  it("rejects invalid timezone and platform-controlled status input", () => {
    const formData = new FormData();
    formData.set("displayName", "Darb Core");
    formData.set("slug", "darb-core");
    formData.set("defaultLocale", "en");
    formData.set("timezone", "Not/A-Timezone");
    formData.set("status", "suspended");

    expect(parseBusinessSettingsInput(formData)).toEqual({
      errors: {
        status: "Choose active or archived.",
        timezone: "Choose a valid IANA timezone.",
      },
      success: false,
    });
  });
});

describe("parseLocationInput", () => {
  it("normalizes a location without inventing optional values", () => {
    const formData = new FormData();
    formData.set("displayName", "  Jerusalem Office  ");
    formData.set("addressLine", "  1 Main Street  ");
    formData.set("locality", "  Jerusalem  ");
    formData.set("postalCode", "  91000  ");
    formData.set("countryCode", " il ");
    formData.set("timezone", "");

    expect(parseLocationInput(formData, "create")).toEqual({
      data: {
        addressLine: "1 Main Street",
        countryCode: "IL",
        displayName: "Jerusalem Office",
        locality: "Jerusalem",
        postalCode: "91000",
        status: "active",
        timezone: "",
      },
      success: true,
    });
  });

  it("validates location status, country, timezone, and field lengths", () => {
    const formData = new FormData();
    formData.set("displayName", "");
    formData.set("countryCode", "Israel");
    formData.set("timezone", "Invalid/Zone");
    formData.set("postalCode", "x".repeat(33));
    formData.set("status", "archived");

    expect(parseLocationInput(formData, "update")).toEqual({
      errors: {
        countryCode: "Use a two-letter ISO country code.",
        displayName: "Enter a location name between 1 and 160 characters.",
        postalCode: "Postal code must be 32 characters or fewer.",
        status: "Choose active or inactive.",
        timezone: "Choose a valid IANA timezone or inherit the business timezone.",
      },
      success: false,
    });
  });
});

describe("currency validation", () => {
  it("accepts only an ISO-style uppercase three-letter code", () => {
    expect(isValidCurrencyCode("ILS")).toBe(true);
    expect(isValidCurrencyCode("ils")).toBe(false);
    expect(isValidCurrencyCode("USDT")).toBe(false);
  });
});
