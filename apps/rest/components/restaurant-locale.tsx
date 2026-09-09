"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SupportedLocale } from "@darb/i18n";

const RestaurantLocaleContext = createContext<SupportedLocale | null>(null);

// Server-resolved publication locale also governs client error/loading boundaries.
export function RestaurantLocaleProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: SupportedLocale;
}) {
  return (
    <RestaurantLocaleContext.Provider value={locale}>{children}</RestaurantLocaleContext.Provider>
  );
}

export function useRestaurantLocale(): SupportedLocale | null {
  return useContext(RestaurantLocaleContext);
}
