"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isSupportedLocale } from "@darb/i18n";

import { listAccessibleBusinesses } from "../../lib/auth";
import { type FormState, parseLoginInput } from "../../lib/forms";
import { adminPaths, getPostSignInDestination, sanitizeReturnPath } from "../../lib/navigation";
import { createServerActionSupabaseClient } from "../../lib/supabase/server";
import { adminLocaleCookie } from "../../lib/i18n";

export async function signInAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseLoginInput(formData);

  if (!parsed.success) {
    return { fieldErrors: parsed.errors, status: "error" };
  }

  const supabase = await createServerActionSupabaseClient();
  const { data: authData, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      message: "The email or password is incorrect. Check your details and try again.",
      status: "error",
    };
  }

  let accessibleBusinessCount: number;

  try {
    accessibleBusinessCount = (await listAccessibleBusinesses(supabase)).length;
  } catch {
    await supabase.auth.signOut({ scope: "local" });
    return {
      message: "We could not finish signing you in. Please try again.",
      status: "error",
    };
  }

  const requestedPath = sanitizeReturnPath(readFormString(formData, "next"));
  const { data: profile } = await supabase
    .schema("core")
    .from("profiles")
    .select("preferred_locale")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (profile?.preferred_locale && isSupportedLocale(profile.preferred_locale)) {
    (await cookies()).set(adminLocaleCookie, profile.preferred_locale, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  redirect(getPostSignInDestination(accessibleBusinessCount, requestedPath));
}

export async function signOutAction(): Promise<never> {
  const supabase = await createServerActionSupabaseClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect(adminPaths.login);
}

function readFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}
