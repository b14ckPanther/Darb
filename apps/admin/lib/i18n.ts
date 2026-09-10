import { isSupportedLocale, type SupportedLocale } from "@darb/i18n";

export const adminLocaleCookie = "darb_admin_locale";
export const adminLocaleQueryParameter = "locale";
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

export function resolveAdminLocaleHandoff(
  pathname: string,
  method: string,
  requestedLocale?: string | null,
): SupportedLocale | null {
  if (!["/login", "/register"].includes(pathname) || method !== "GET") return null;
  return requestedLocale && isSupportedLocale(requestedLocale) ? requestedLocale : null;
}

export function getAdminLocaleCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
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
