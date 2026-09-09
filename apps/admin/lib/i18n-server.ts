import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { isSupportedLocale } from "@darb/i18n";

import { resolveCurrentUser } from "./auth";
import { adminLocaleCookie, createAdminTranslator, resolveAdminLocale } from "./i18n";
import { getAdminMessages } from "./messages";
import { createServerComponentSupabaseClient } from "./supabase/server";

export const getAdminLocale = cache(async () => {
  const cookieLocale = (await cookies()).get(adminLocaleCookie)?.value;
  if (cookieLocale && isSupportedLocale(cookieLocale)) return cookieLocale;

  try {
    const supabase = await createServerComponentSupabaseClient();
    const user = await resolveCurrentUser(supabase);
    if (user) {
      const { data } = await supabase
        .schema("core")
        .from("profiles")
        .select("preferred_locale")
        .eq("id", user.id)
        .maybeSingle();
      return resolveAdminLocale(null, data?.preferred_locale);
    }
  } catch {
    // Locale preferences must not prevent the login or recovery screen from rendering.
  }
  return resolveAdminLocale();
});

export const getAdminI18n = cache(async () => {
  const locale = await getAdminLocale();
  const messages = getAdminMessages(locale);
  return { locale, messages, t: createAdminTranslator(locale, messages) };
});
