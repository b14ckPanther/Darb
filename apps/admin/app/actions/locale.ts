"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { isSupportedLocale } from "@darb/i18n";

import { resolveCurrentUser } from "../../lib/auth";
import { adminLocaleCookie } from "../../lib/i18n";
import { createServerActionSupabaseClient } from "../../lib/supabase/server";

export async function setAdminLocaleAction(requestedLocale: string): Promise<{ error?: string }> {
  if (!isSupportedLocale(requestedLocale)) return { error: "Choose a supported language." };

  try {
    const supabase = await createServerActionSupabaseClient();
    const user = await resolveCurrentUser(supabase);
    if (user) {
      const { data, error } = await supabase
        .schema("core")
        .from("profiles")
        .update({ preferred_locale: requestedLocale })
        .eq("id", user.id)
        .select("id")
        .single();
      if (error || !data) return { error: "We could not save your language. Please try again." };
    }
    (await cookies()).set(adminLocaleCookie, requestedLocale, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  } catch {
    return { error: "We could not save your language. Please try again." };
  }
  revalidatePath("/", "layout");
  return {};
}
