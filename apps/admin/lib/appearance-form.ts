import {
  getThemeContrastIssues,
  resolveTheme,
  validateThemeOverrides,
  type ThemeOverrides,
  type ThemeTokens,
} from "@darb/theme";

import type { FieldErrors } from "./forms";

export type AppearanceParseResult =
  | { data: { moduleKey: string; overrides: ThemeOverrides; templateKey: string }; success: true }
  | { errors: FieldErrors; message?: string; success: false };

const moduleKeyPattern = /^[a-z][a-z0-9_]*$/;
const templateKeyPattern = /^[a-z][a-z0-9_]*(?:-[a-z0-9_]+)*$/;

export function parseAppearanceInput(
  formData: FormData,
  templateTheme: ThemeTokens,
): AppearanceParseResult {
  const moduleKey = readString(formData, "moduleKey").trim();
  const templateKey = readString(formData, "templateKey").trim();
  const rawOverrides = readString(formData, "themeOverrides");
  const errors: Record<string, string> = {};
  let overrides: unknown;

  if (!moduleKeyPattern.test(moduleKey)) errors.moduleKey = "Choose an enabled appearance context.";
  if (!templateKeyPattern.test(templateKey)) errors.templateKey = "Choose an available template.";

  try {
    overrides = JSON.parse(rawOverrides || "{}");
  } catch {
    errors.themeOverrides = "The appearance settings could not be read.";
  }

  const validation = validateThemeOverrides(overrides);
  if (!validation.valid)
    errors.themeOverrides = "Some theme values are outside the supported token set.";

  if (Object.keys(errors).length > 0 || !validation.valid) return { errors, success: false };

  const typedOverrides = overrides as ThemeOverrides;
  const criticalIssue = getThemeContrastIssues(resolveTheme(templateTheme, typedOverrides)).find(
    (issue) => issue.level === "error",
  );
  if (criticalIssue) {
    return {
      errors: { themeOverrides: "Primary text and action colors must meet accessible contrast." },
      message: "Resolve the critical contrast warning before saving.",
      success: false,
    };
  }

  return { data: { moduleKey, overrides: typedOverrides, templateKey }, success: true };
}

export function parseAppearanceResetInput(formData: FormData): string | null {
  const moduleKey = readString(formData, "moduleKey").trim();
  return moduleKeyPattern.test(moduleKey) ? moduleKey : null;
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
