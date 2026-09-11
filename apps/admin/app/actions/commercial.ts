"use server";

import { revalidatePath } from "next/cache";

import type { FormState } from "../../lib/forms";
import { businessSectionPath } from "../../lib/navigation";
import { requireActionBusiness } from "../../lib/action-context";
import { createServerActionSupabaseClient } from "../../lib/supabase/server";

export async function requestInitialSetupAction(
  businessId: string,
  businessSlug: string,
  _previousState: FormState,
): Promise<FormState> {
  void _previousState;
  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);
  if (business.status !== "active") {
    return {
      message: "Initial setup can only be requested for an active business.",
      status: "error",
    };
  }

  const { data, error } = await supabase
    .schema("core")
    .rpc("request_business_initial_setup", { target_business_id: business.id })
    .single();
  if (error || !data) {
    return {
      message:
        error?.code === "42501"
          ? "Business management permission is required to request initial setup."
          : "Initial setup could not be requested. Try again.",
      status: "error",
    };
  }

  revalidatePath(businessSectionPath(businessSlug, "modules"));
  return {
    message: data.changed
      ? "Initial setup request sent. Darb can now coordinate the service with you."
      : "Initial setup has already been requested.",
    status: "success",
  };
}
