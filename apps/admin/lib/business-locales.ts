import "server-only";

import type { SupportedLocale } from "@darb/i18n";
import type { DarbServerSupabaseClient } from "@darb/database/server";
import type { Database } from "@darb/database/types";

type BusinessLocaleRow = Database["core"]["Tables"]["business_locales"]["Row"];

export type AccessibleBusinessLocale = Pick<
  BusinessLocaleRow,
  "created_at" | "is_enabled" | "locale_code" | "updated_at"
>;

export interface BusinessLocaleState {
  defaultLocale: SupportedLocale;
  enabledLocales: SupportedLocale[];
}

export async function listBusinessLocales(
  supabase: DarbServerSupabaseClient,
  businessId: string,
): Promise<AccessibleBusinessLocale[]> {
  const { data, error } = await supabase
    .schema("core")
    .from("business_locales")
    .select("locale_code, is_enabled, created_at, updated_at")
    .eq("business_id", businessId)
    .order("locale_code", { ascending: true });

  if (error) {
    throw new Error(`Unable to load business languages (${error.code}).`);
  }

  return data;
}

export function mapBusinessLocaleState(
  rows: readonly AccessibleBusinessLocale[],
  defaultLocale: SupportedLocale,
): BusinessLocaleState {
  const enabledLocales = rows
    .filter((locale) => locale.is_enabled)
    .map((locale) => locale.locale_code);

  if (!enabledLocales.includes(defaultLocale)) {
    enabledLocales.push(defaultLocale);
  }

  return { defaultLocale, enabledLocales: [...new Set(enabledLocales)].sort() };
}
