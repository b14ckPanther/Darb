import { darbApplications } from "@darb/config/platform";
import {
  getTextDirection,
  isSupportedLocale,
  supportedLocales,
  type SupportedLocale,
} from "@darb/i18n";

export const mainOrigin = `https://${darbApplications.main.productionHost}`;
export const defaultPublicLocale = "ar" satisfies SupportedLocale;

export const publicLocaleNames: Readonly<Record<SupportedLocale, string>> = {
  ar: "العربية",
  he: "עברית",
  en: "English",
};

export const publicLocaleTags: Readonly<Record<SupportedLocale, string>> = {
  ar: "ar-IL",
  he: "he-IL",
  en: "en-IL",
};

export function resolvePublicLocale(value: string): SupportedLocale | null {
  return isSupportedLocale(value) ? value : null;
}

export function getPublicLocalePath(locale: SupportedLocale): `/${SupportedLocale}` {
  return `/${locale}`;
}

export function getPublicLocaleUrl(locale: SupportedLocale): string {
  return `${mainOrigin}${getPublicLocalePath(locale)}`;
}

export function getPublicAlternates(): Readonly<Record<string, string>> {
  return {
    ...Object.fromEntries(
      supportedLocales.map((locale) => [publicLocaleTags[locale], getPublicLocaleUrl(locale)]),
    ),
    "x-default": `${mainOrigin}/`,
  };
}

export function getPublicLocaleDirection(locale: SupportedLocale) {
  return getTextDirection(locale);
}
