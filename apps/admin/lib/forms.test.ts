import { describe, expect, it } from "vitest";

import { parseBusinessBootstrapInput, parseLoginInput } from "./forms";

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
