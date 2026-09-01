import { resolveMotionDuration, resolveThemeTypography } from "./resolve";
import type { DarbThemeLocale, ThemeTokens } from "./types";

export type ThemeCssVariables = Record<`--darb-theme-${string}`, string>;

export function themeToCssVariables(
  theme: ThemeTokens,
  locale: DarbThemeLocale,
  prefersReducedMotion = false,
): ThemeCssVariables {
  const typography = resolveThemeTypography(locale);
  const radii = { bold: "1.75rem", rounded: "1.1rem", soft: "0.55rem" } as const;
  const borders = { defined: "2px", hairline: "1px", none: "0px" } as const;
  const density = { compact: "0.75", comfortable: "1", spacious: "1.25" } as const;
  const shadows = {
    medium: "0 18px 50px rgb(20 37 30 / 0.16)",
    none: "none",
    strong: "0 24px 68px rgb(20 37 30 / 0.24)",
    subtle: "0 12px 36px rgb(20 37 30 / 0.10)",
  } as const;
  const contentWidths = { balanced: "72rem", focused: "58rem", wide: "88rem" } as const;
  const sectionSpacing = { comfortable: "4.5rem", compact: "3rem", spacious: "7rem" } as const;
  const fontScale = { balanced: "1", compact: "0.92", generous: "1.1" } as const;
  const lineHeights = { airy: "1.75", comfortable: "1.6", snug: "1.4" } as const;
  const tracking = { normal: "0em", open: "0.018em", tight: "-0.018em" } as const;

  return {
    "--darb-theme-accent": theme.colors.accent,
    "--darb-theme-border": theme.colors.border,
    "--darb-theme-border-width": borders[theme.shape.border],
    "--darb-theme-content-width": contentWidths[theme.layout.contentWidth],
    "--darb-theme-danger": theme.colors.danger,
    "--darb-theme-density": density[theme.density],
    "--darb-theme-elevated": theme.colors.elevated,
    "--darb-theme-font-body-weight": String(theme.typography.bodyWeight),
    "--darb-theme-font-family": typography.fontFamily,
    "--darb-theme-font-heading-weight": String(theme.typography.headingWeight),
    "--darb-theme-font-scale": fontScale[theme.typography.scale],
    "--darb-theme-letter-spacing":
      typography.direction === "rtl" ? "0em" : tracking[theme.typography.tracking],
    "--darb-theme-line-height": lineHeights[theme.typography.lineHeight],
    "--darb-theme-motion-duration": resolveMotionDuration(theme.motion, prefersReducedMotion),
    "--darb-theme-on-primary": theme.colors.onPrimary,
    "--darb-theme-page": theme.colors.page,
    "--darb-theme-primary": theme.colors.primary,
    "--darb-theme-radius": radii[theme.shape.radius],
    "--darb-theme-section-spacing": sectionSpacing[theme.layout.sectionSpacing],
    "--darb-theme-shadow": shadows[theme.shadow],
    "--darb-theme-success": theme.colors.success,
    "--darb-theme-surface": theme.colors.surface,
    "--darb-theme-text-muted": theme.colors.textMuted,
    "--darb-theme-text-primary": theme.colors.textPrimary,
    "--darb-theme-text-secondary": theme.colors.textSecondary,
    "--darb-theme-warning": theme.colors.warning,
  };
}
