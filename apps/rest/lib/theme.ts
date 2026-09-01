import type { SupportedLocale } from "@darb/i18n";
import type { PublicRestaurantAppearance } from "@darb/restaurant";
import {
  isThemeOverrides,
  isThemeTokens,
  resolveTheme,
  safeFallbackTheme,
  themeToCssVariables,
  type ThemeCssVariables,
} from "@darb/theme";

export function resolveRestaurantTheme(
  appearance: PublicRestaurantAppearance,
  locale: SupportedLocale,
): ThemeCssVariables {
  const base = isThemeTokens(appearance.defaultTheme) ? appearance.defaultTheme : safeFallbackTheme;
  const overrides = isThemeOverrides(appearance.overrides) ? appearance.overrides : {};
  return themeToCssVariables(resolveTheme(base, overrides), locale);
}
