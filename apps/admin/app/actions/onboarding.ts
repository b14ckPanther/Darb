"use server";

import { redirect } from "next/navigation";

import {
  type FormState,
  parseBusinessBootstrapInput,
  parseFirstBusinessSetupInput,
} from "../../lib/forms";
import { adminPaths, businessPath } from "../../lib/navigation";
import { requireActionBusiness } from "../../lib/action-context";
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
  const { data, error } = await supabase.schema("core").rpc("bootstrap_first_business", {
    requested_default_locale: parsed.data.defaultLocale,
    requested_display_name: parsed.data.displayName,
    requested_slug: parsed.data.slug,
  });

  if (!error && data?.[0]) {
    redirect(`${businessPath(data[0].business_slug)}/setup`);
  }

  if (!error) {
    return {
      message: "We could not create the business. Review the details and try again.",
      status: "error",
    };
  }

  if (error.code === "23505") {
    return {
      fieldErrors: { slug: "That slug is already in use. Choose another." },
      status: "error",
    };
  }

  if (error.message.includes("BUSINESS_SLUG_RESERVED")) {
    return {
      fieldErrors: { slug: "That address is reserved by Darb. Choose another." },
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

export async function completeFirstBusinessSetupAction(
  businessId: string,
  businessSlug: string,
  defaultLocale: "ar" | "he" | "en",
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseFirstBusinessSetupInput(formData, defaultLocale);
  if (!parsed.success) return { fieldErrors: parsed.errors, status: "error" };

  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);
  const { error } = await supabase.schema("core").rpc("complete_first_business_onboarding", {
    requested_create_location: parsed.data.createLocation,
    requested_enabled_locales: parsed.data.enabledLocales,
    requested_location_address: parsed.data.locationAddress,
    requested_location_locality: parsed.data.locationLocality,
    requested_location_name: parsed.data.locationName,
    requested_module_key: parsed.data.moduleKey,
    target_business_id: business.id,
  });

  if (error) {
    if (error.code === "42501")
      return { message: "You no longer have access to complete this setup.", status: "error" };
    return {
      message:
        "We could not finish setup. Nothing partial was saved; review the details and try again.",
      status: "error",
    };
  }

  redirect(
    parsed.data.moduleKey === "restaurant"
      ? `${businessPath(businessSlug)}/restaurant`
      : businessPath(businessSlug),
  );
}
