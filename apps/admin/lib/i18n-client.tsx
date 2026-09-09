"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { SupportedLocale } from "@darb/i18n";

import { createAdminTranslator, type AdminDictionary } from "./i18n";

const AdminLocaleContext = createContext({
  locale: "en" as SupportedLocale,
  t: createAdminTranslator("en", {}),
});

export function AdminLocaleProvider({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: SupportedLocale;
  messages: AdminDictionary;
}) {
  const value = useMemo(
    () => ({ locale, t: createAdminTranslator(locale, messages) }),
    [locale, messages],
  );
  return <AdminLocaleContext.Provider value={value}>{children}</AdminLocaleContext.Provider>;
}

export function useAdminI18n() {
  return useContext(AdminLocaleContext);
}
