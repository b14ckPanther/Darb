"use server";

import { redirect } from "next/navigation";

import { type FormState, parseBusinessBootstrapInput } from "../../lib/forms";
import { adminPaths } from "../../lib/navigation";
import { createServerActionSupabaseClient } from "../../lib/supabase/server";

export async function bootstrapBusinessAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseBusinessBootstrapInput(formData);

  if (!parsed.success) {
    return { fieldErrors: parsed.errors, status: "error" };
  }

  const supabase = await createServerActionSupabaseClient();
  const { error } = await supabase.schema("core").rpc("bootstrap_first_business", {
    requested_default_locale: parsed.data.defaultLocale,
    requested_display_name: parsed.data.displayName,
    requested_slug: parsed.data.slug,
  });

  if (!error) {
    redirect(adminPaths.home);
  }

  if (error.code === "23505") {
    return {
      fieldErrors: { slug: "That slug is already in use. Choose another." },
      status: "error",
    };
  }

  if (error.code === "42501") {
    redirect(adminPaths.login);
  }

  if (error.message.includes("FIRST_BUSINESS_ALREADY_BOOTSTRAPPED")) {
    redirect(adminPaths.home);
  }

  return {
    message: "We could not create the business. Review the details and try again.",
    status: "error",
  };
}
