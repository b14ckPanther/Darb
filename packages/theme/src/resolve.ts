import type {
  DarbThemeLocale,
  ResolvedTemplateSelection,
  ThemeOverrides,
  ThemeTemplateCandidate,
  ThemeTokens,
} from "./types";

export function resolveTheme(base: ThemeTokens, overrides: ThemeOverrides = {}): ThemeTokens {
  return {
    colors: { ...base.colors, ...overrides.colors },
    density: overrides.density ?? base.density,
    layout: { ...base.layout, ...overrides.layout },
    motion: overrides.motion ?? base.motion,
    shadow: overrides.shadow ?? base.shadow,
    shape: { ...base.shape, ...overrides.shape },
    typography: { ...base.typography, ...overrides.typography },
  };
}

export function resolveTemplateSelection(
  templates: readonly ThemeTemplateCandidate[],
  selectedKey: string | null,
): ResolvedTemplateSelection {
  const selected = selectedKey ? templates.find((template) => template.key === selectedKey) : null;
  if (selected?.isAvailable) return { fallbackReason: null, template: selected };

  const fallback =
    templates.find((template) => template.isAvailable && template.isDefault) ??
    templates.find((template) => template.isAvailable) ??
    null;

  return {
    fallbackReason: selectedKey ? (selected ? "selected_unavailable" : "selected_unknown") : null,
    template: fallback,
  };
}

export function resolveThemeTypography(locale: DarbThemeLocale): {
  direction: "ltr" | "rtl";
  fontFamily: string;
  language: DarbThemeLocale;
} {
  const fontFamily = "var(--font-ubuntu), var(--font-cairo), var(--font-heebo), sans-serif";

  if (locale === "ar") {
    return { direction: "rtl", fontFamily, language: locale };
  }
  if (locale === "he") {
    return { direction: "rtl", fontFamily, language: locale };
  }
  return { direction: "ltr", fontFamily, language: locale };
}

export function resolveMotionDuration(
  motion: ThemeTokens["motion"],
  prefersReducedMotion: boolean,
): string {
  if (prefersReducedMotion || motion === "reduced") return "0ms";
  return motion === "expressive" ? "320ms" : "180ms";
}
