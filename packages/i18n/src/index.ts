export const supportedLocales = ["ar", "he", "en"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];
export type TextDirection = "ltr" | "rtl";

export const localeNames: Readonly<Record<SupportedLocale, string>> = {
  ar: "العربية",
  he: "עברית",
  en: "English",
};

export const localeTags: Readonly<Record<SupportedLocale, string>> = {
  ar: "ar-IL",
  he: "he-IL",
  en: "en-IL",
};

const localeDirections: Readonly<Record<SupportedLocale, TextDirection>> = {
  ar: "rtl",
  he: "rtl",
  en: "ltr",
};

const supportedLocaleSet = new Set<string>(supportedLocales);

export function getTextDirection(locale: SupportedLocale): TextDirection {
  return localeDirections[locale];
}

export function isSupportedLocale(value: string): value is SupportedLocale {
  return supportedLocaleSet.has(value);
}
