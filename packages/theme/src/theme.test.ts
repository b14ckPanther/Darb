import { describe, expect, it } from "vitest";

import {
  contrastRatio,
  getThemeContrastIssues,
  resolveMotionDuration,
  resolveTemplateSelection,
  resolveTheme,
  resolveThemeTypography,
  safeFallbackTheme,
  themeToCssVariables,
  validateThemeOverrides,
  validateThemeTokens,
} from "./index";

describe("Darb theme contracts", () => {
  it("validates the controlled fallback theme and rejects arbitrary CSS-like input", () => {
    expect(validateThemeTokens(safeFallbackTheme)).toEqual({ issues: [], valid: true });
    expect(validateThemeOverrides({ colors: { primary: "url(https://example.test)" } })).toEqual({
      issues: [{ code: "invalid_color", path: "colors.primary" }],
      valid: false,
    });
    expect(validateThemeOverrides({ css: "position: fixed" })).toEqual({
      issues: [{ code: "unknown_key", path: "$.css" }],
      valid: false,
    });
  });

  it("requires complete default themes while allowing closed partial overrides", () => {
    expect(validateThemeTokens({ colors: {} }).valid).toBe(false);
    expect(
      validateThemeOverrides({ colors: { primary: "#123456" }, shape: { radius: "bold" } }),
    ).toEqual({
      issues: [],
      valid: true,
    });
  });

  it("resolves nested overrides without mutating the base theme", () => {
    const resolved = resolveTheme(safeFallbackTheme, {
      colors: { primary: "#123456" },
      layout: { contentWidth: "wide" },
    });
    expect(resolved.colors.primary).toBe("#123456");
    expect(resolved.colors.page).toBe(safeFallbackTheme.colors.page);
    expect(resolved.layout.contentWidth).toBe("wide");
    expect(safeFallbackTheme.colors.primary).toBe("#154734");
  });

  it("computes WCAG contrast and separates blocking failures from warnings", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 3);
    expect(
      getThemeContrastIssues(safeFallbackTheme).filter((issue) => issue.level === "error"),
    ).toEqual([]);
    const unsafe = resolveTheme(safeFallbackTheme, {
      colors: { onPrimary: "#154734", textPrimary: "#F5F1E8" },
    });
    expect(getThemeContrastIssues(unsafe).some((issue) => issue.level === "error")).toBe(true);
  });

  it("falls back deterministically when a selected template is missing or unavailable", () => {
    const templates = [
      {
        defaultTheme: safeFallbackTheme,
        isAvailable: true,
        isDefault: true,
        key: "base",
        moduleKey: "pages",
      },
      {
        defaultTheme: safeFallbackTheme,
        isAvailable: false,
        isDefault: false,
        key: "retired",
        moduleKey: "pages",
      },
    ];
    expect(resolveTemplateSelection(templates, "base").fallbackReason).toBeNull();
    expect(resolveTemplateSelection(templates, "retired")).toMatchObject({
      fallbackReason: "selected_unavailable",
      template: { key: "base" },
    });
    expect(resolveTemplateSelection(templates, "missing")).toMatchObject({
      fallbackReason: "selected_unknown",
      template: { key: "base" },
    });
  });

  it("maps locale typography and lets reduced-motion preference win", () => {
    expect(resolveThemeTypography("ar")).toMatchObject({ direction: "rtl", language: "ar" });
    expect(resolveThemeTypography("he").fontFamily).toContain("heebo");
    expect(resolveThemeTypography("en")).toMatchObject({ direction: "ltr", language: "en" });
    expect(resolveMotionDuration("expressive", true)).toBe("0ms");
    expect(resolveMotionDuration("expressive", false)).toBe("320ms");
  });

  it("emits only namespaced controlled CSS variables", () => {
    const variables = themeToCssVariables(safeFallbackTheme, "ar", true);
    expect(Object.keys(variables).every((key) => key.startsWith("--darb-theme-"))).toBe(true);
    expect(variables["--darb-theme-letter-spacing"]).toBe("0em");
    expect(variables["--darb-theme-motion-duration"]).toBe("0ms");
  });
});
