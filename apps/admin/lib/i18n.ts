import { isSupportedLocale, type SupportedLocale } from "@darb/i18n";

export const adminLocaleCookie = "darb_admin_locale";
export type AdminMessageValues = Readonly<Record<string, string | number>>;
export type AdminDictionary = Readonly<Record<string, string>>;
export type AdminTranslations = Readonly<Record<string, Readonly<{ ar: string; he: string }>>>;

export function resolveAdminLocale(
  cookieLocale?: string | null,
  profileLocale?: string | null,
): SupportedLocale {
  if (cookieLocale && isSupportedLocale(cookieLocale)) return cookieLocale;
  if (profileLocale && isSupportedLocale(profileLocale)) return profileLocale;
  return "en";
}

export function createAdminTranslator(locale: SupportedLocale, messages: AdminDictionary) {
  return (message: string, values: AdminMessageValues = {}): string => {
    const template = messages[message] ?? message;
    return template.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (placeholder, key: string) => {
      const value = values[key];
      if (value === undefined) return placeholder;
      return typeof value === "number" ? new Intl.NumberFormat(locale).format(value) : value;
    });
  };
}
