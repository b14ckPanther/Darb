import { describe, expect, it } from "vitest";

import { safeFallbackTheme } from "@darb/theme";

import { parseAppearanceInput, parseAppearanceResetInput } from "./appearance-form";

describe("appearance form validation", () => {
  it("accepts a closed semantic override document", () => {
    const formData = appearanceForm({
      colors: { primary: "#173E32", onPrimary: "#FFFFFF" },
      density: "spacious",
      shape: { radius: "bold" },
    });
    const result = parseAppearanceInput(formData, safeFallbackTheme);
    expect(result).toMatchObject({
      data: { moduleKey: "pages", templateKey: "foundation-canvas" },
      success: true,
    });
  });

  it("rejects malformed targets, arbitrary keys, and non-JSON payloads", () => {
    const invalidTarget = appearanceForm({}, "Bad Module", "../template");
    expect(parseAppearanceInput(invalidTarget, safeFallbackTheme)).toMatchObject({
      errors: { moduleKey: expect.any(String), templateKey: expect.any(String) },
      success: false,
    });

    const arbitrary = appearanceForm({ css: "position: fixed" });
    expect(parseAppearanceInput(arbitrary, safeFallbackTheme)).toMatchObject({
      errors: { themeOverrides: expect.any(String) },
      success: false,
    });

    const malformed = appearanceForm({});
    malformed.set("themeOverrides", "{");
    expect(parseAppearanceInput(malformed, safeFallbackTheme)).toMatchObject({
      errors: { themeOverrides: expect.any(String) },
      success: false,
    });
  });

  it("blocks critical contrast failure before the database round trip", () => {
    const result = parseAppearanceInput(
      appearanceForm({ colors: { primary: "#FFFFFF", onPrimary: "#FFFFFF" } }),
      safeFallbackTheme,
    );
    expect(result).toEqual({
      errors: { themeOverrides: "Primary text and action colors must meet accessible contrast." },
      message: "Resolve the critical contrast warning before saving.",
      success: false,
    });
  });

  it("parses only stable module keys for reset", () => {
    const valid = new FormData();
    valid.set("moduleKey", "pages");
    expect(parseAppearanceResetInput(valid)).toBe("pages");
    valid.set("moduleKey", "pages<script>");
    expect(parseAppearanceResetInput(valid)).toBeNull();
  });
});

function appearanceForm(
  overrides: unknown,
  moduleKey = "pages",
  templateKey = "foundation-canvas",
): FormData {
  const formData = new FormData();
  formData.set("moduleKey", moduleKey);
  formData.set("templateKey", templateKey);
  formData.set("themeOverrides", JSON.stringify(overrides));
  return formData;
}
