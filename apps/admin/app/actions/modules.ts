"use server";

import { revalidatePath } from "next/cache";

import { requireActionBusiness } from "../../lib/action-context";
import { hasBusinessPermission } from "../../lib/auth";
import type { FormState } from "../../lib/forms";
import { parseModuleMutationInput } from "../../lib/module-form";
import { listBusinessModuleStates } from "../../lib/modules";
import { mapMutationError } from "../../lib/mutation-errors";
import { businessPath, businessSectionPath } from "../../lib/navigation";
import { createServerActionSupabaseClient } from "../../lib/supabase/server";

export async function setBusinessModuleEnabledAction(
  businessId: string,
  businessSlug: string,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseModuleMutationInput(formData);

  if (!parsed.success) {
    return { message: parsed.message, status: "error" };
  }

  const supabase = await createServerActionSupabaseClient();
  const business = await requireActionBusiness(supabase, businessId);

  if (business.status !== "active") {
    return mapMutationError(
      { message: `BUSINESS_MODULES_${business.status.toUpperCase()}` },
      "module",
    );
  }

  if (!(await hasBusinessPermission(supabase, business.id, "modules.manage"))) {
    return mapMutationError({ code: "42501" }, "module");
  }

  const modules = await listBusinessModuleStates(supabase, business.id, business.status);
  const capability = modules.find((candidate) => candidate.key === parsed.data.moduleKey);

  if (!capability) {
    return mapMutationError({ message: "MODULE_NOT_FOUND" }, "module");
  }

  if (parsed.data.enabled && !capability.isAvailable) {
    return mapMutationError({ message: "MODULE_UNAVAILABLE" }, "module");
  }

  const { data, error } = await supabase
    .schema("core")
    .rpc("set_business_module_enabled", {
      requested_enabled: parsed.data.enabled,
      target_business_id: business.id,
      target_module_key: capability.key,
    })
    .single();

  if (error || !data) {
    return mapMutationError(error ?? {}, "module");
  }

  revalidatePath(businessPath(businessSlug));
  revalidatePath(businessSectionPath(businessSlug, "modules"));

  if (!data.changed) {
    return {
      message: `${capability.displayName} was already ${data.is_enabled ? "enabled" : "disabled"}.`,
      status: "success",
    };
  }

  return {
    message: `${capability.displayName} ${data.is_enabled ? "enabled" : "disabled"}.`,
    status: "success",
  };
}
