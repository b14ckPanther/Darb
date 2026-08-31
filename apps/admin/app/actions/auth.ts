"use server";

import { redirect } from "next/navigation";

import { listAccessibleBusinesses } from "../../lib/auth";
import { type FormState, parseLoginInput } from "../../lib/forms";
import { adminPaths, getPostSignInDestination, sanitizeReturnPath } from "../../lib/navigation";
import { createServerActionSupabaseClient } from "../../lib/supabase/server";

export async function signInAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseLoginInput(formData);

  if (!parsed.success) {
    return { fieldErrors: parsed.errors, status: "error" };
  }

  const supabase = await createServerActionSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

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
