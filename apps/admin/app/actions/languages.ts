"use server";

import { revalidatePath } from "next/cache";

import { requireActionBusiness } from "../../lib/action-context";
import { hasBusinessPermission } from "../../lib/auth";
import type { FormState } from "../../lib/forms";
import { mapMutationError } from "../../lib/mutation-errors";
import { businessPath, businessSectionPath } from "../../lib/navigation";
import { parseBusinessLocalesInput } from "../../lib/phase6-forms";
import { createServerActionSupabaseClient } from "../../lib/supabase/server";

export async function updateBusinessLanguagesAction(
  businessId: string,
  businessSlug: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseBusinessLocalesInput(formData);

  if (!parsed.success) {
    return { fieldErrors: parsed.errors, status: "error" };
  }

  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);

  if (!(await hasBusinessPermission(supabase, business.id, "business.manage"))) {
    return mapMutationError({ code: "42501" }, "languages");
  }

  const { data, error } = await supabase
    .schema("core")
    .rpc("update_business_locales", {
      requested_default_locale: parsed.data.defaultLocale,
      requested_enabled_locales: parsed.data.enabledLocales,
      target_business_id: business.id,
    })
    .single();

  if (error || !data) {
    return mapMutationError(error ?? {}, "languages");
  }

  revalidatePath(businessPath(businessSlug));
  revalidatePath(businessSectionPath(businessSlug, "languages"));
  revalidatePath(businessSectionPath(businessSlug, "settings"));

  return {
    message: data.changed
      ? "Business languages saved."
      : "Business languages were already current.",
    status: "success",
  };
}
