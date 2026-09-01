import {
  themeColorKeys,
  type ThemeOverrides,
  type ThemeTokens,
  type ThemeValidationIssue,
  type ThemeValidationResult,
} from "./types";

const topLevelKeys = ["colors", "density", "layout", "motion", "shadow", "shape", "typography"];
const layoutKeys = ["cardImageRatio", "contentWidth", "heroTreatment", "sectionSpacing"];
const shapeKeys = ["border", "radius"];
const typographyKeys = ["bodyWeight", "headingWeight", "lineHeight", "scale", "tracking"];
const hexColorPattern = /^#[0-9A-F]{6}$/;

export function validateThemeTokens(value: unknown): ThemeValidationResult {
  return validateTheme(value, true);
}

export function validateThemeOverrides(value: unknown): ThemeValidationResult {
  return validateTheme(value, false);
}

export function isThemeTokens(value: unknown): value is ThemeTokens {
  return validateThemeTokens(value).valid;
}

export function isThemeOverrides(value: unknown): value is ThemeOverrides {
  return validateThemeOverrides(value).valid;
}

function validateTheme(value: unknown, complete: boolean): ThemeValidationResult {
  const issues: ThemeValidationIssue[] = [];
  if (!isRecord(value)) {
    return { issues: [{ code: "invalid_type", path: "$" }], valid: false };
  }

  checkKeys(value, topLevelKeys, "$", complete, issues);
  validateObject(value.colors, themeColorKeys, "colors", complete, issues, (color, path) => {
    if (typeof color !== "string" || !hexColorPattern.test(color)) {
      issues.push({ code: "invalid_color", path });
    }
  });
  validateEnum(value.density, ["compact", "comfortable", "spacious"], "density", complete, issues);
  validateObject(value.layout, layoutKeys, "layout", complete, issues, (item, path, key) => {
    const values: Record<string, readonly unknown[]> = {
      cardImageRatio: ["square", "landscape", "portrait"],
      contentWidth: ["focused", "balanced", "wide"],
      heroTreatment: ["minimal", "split", "immersive"],
      sectionSpacing: ["compact", "comfortable", "spacious"],
    };
    validateEnum(item, values[key] ?? [], path, true, issues);
  });
  validateEnum(value.motion, ["reduced", "subtle", "expressive"], "motion", complete, issues);
  validateEnum(value.shadow, ["none", "subtle", "medium", "strong"], "shadow", complete, issues);
  validateObject(value.shape, shapeKeys, "shape", complete, issues, (item, path, key) => {
    validateEnum(
      item,
      key === "radius" ? ["soft", "rounded", "bold"] : ["none", "hairline", "defined"],
      path,
      true,
      issues,
    );
  });
  validateObject(
    value.typography,
    typographyKeys,
    "typography",
    complete,
    issues,
    (item, path, key) => {
      const values: Record<string, readonly unknown[]> = {
        bodyWeight: [400, 500],
        headingWeight: [600, 700, 800],
        lineHeight: ["snug", "comfortable", "airy"],
        scale: ["compact", "balanced", "generous"],
        tracking: ["tight", "normal", "open"],
      };
      validateEnum(item, values[key] ?? [], path, true, issues);
    },
  );

  return { issues, valid: issues.length === 0 };
}

function validateObject(
  value: unknown,
  allowedKeys: readonly string[],
  path: string,
  complete: boolean,
  issues: ThemeValidationIssue[],
  validateValue: (value: unknown, path: string, key: string) => void,
): void {
  if (value === undefined && !complete) return;
  if (!isRecord(value)) {
    issues.push({ code: value === undefined ? "missing_value" : "invalid_type", path });
    return;
  }

  checkKeys(value, allowedKeys, path, complete, issues);
  for (const key of allowedKeys) {
    if (key in value) validateValue(value[key], `${path}.${key}`, key);
  }
}

function validateEnum(
  value: unknown,
  values: readonly unknown[],
  path: string,
  complete: boolean,
  issues: ThemeValidationIssue[],
): void {
  if (value === undefined && !complete) return;
  if (value === undefined) {
    issues.push({ code: "missing_value", path });
  } else if (!values.includes(value)) {
    issues.push({ code: "invalid_value", path });
  }
}

function checkKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  path: string,
  complete: boolean,
  issues: ThemeValidationIssue[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) issues.push({ code: "unknown_key", path: `${path}.${key}` });
  }
  if (!complete) return;
  for (const key of allowedKeys) {
    if (!(key in value)) issues.push({ code: "missing_value", path: `${path}.${key}` });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
